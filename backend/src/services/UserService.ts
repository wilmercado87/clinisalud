import * as bcrypt from "bcryptjs";
import { Op } from "sequelize";
import User from "../models/User";
import Role from "../models/Role";
import UserMenuOverride from "../models/UserMenuOverride";
import RoleMenuPermission from "../models/RoleMenuPermission";
import { ApiError } from "../middlewares/ErrorHandlerMiddleware";

interface CreateUserData {
  email: string;
  dni: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  roleId: number;
  permissions: number[];
}

export class UserService {
  public async findAllManageableUsers() {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      include: [
        { model: Role, as: "roleData", attributes: ["id", "name", "code"] },
        { model: UserMenuOverride, as: "menuOverrides" },
      ],
      order: [["createdAt", "DESC"]],
    });

    const roleIds = [...new Set(users.map(u => (u.toJSON() as any).roleData?.id).filter(Boolean))];
    const allRolePerms = roleIds.length > 0
      ? await RoleMenuPermission.findAll({ where: { roleId: roleIds } })
      : [];
    const permsByRole = new Map<number, RoleMenuPermission[]>();
    for (const p of allRolePerms) {
      if (!permsByRole.has(p.roleId)) permsByRole.set(p.roleId, []);
      permsByRole.get(p.roleId)!.push(p);
    }

    return users.map(user => {
      const userJson = user.toJSON() as any;
      if (userJson.roleData) {
        userJson.role = userJson.roleData.code;
        const roleId = userJson.roleData.id;
        const rolePerms = permsByRole.get(roleId) || [];
        userJson.roleData.permissions = this.resolvePermissionsFromArrays(rolePerms, userJson.menuOverrides || []);
        delete userJson.menuOverrides;
      }
      return userJson;
    });
  }

  private resolvePermissionsFromArrays(rolePerms: RoleMenuPermission[], overrides: any[]): { menuOptionId: number; hasAccess: boolean }[] {
    const overrideMap = new Map(overrides.map(o => [o.menuOptionId, o.hasAccess]));

    const allMenuIds = new Set([
      ...rolePerms.map(p => p.menuOptionId),
      ...overrides.map(o => o.menuOptionId),
    ]);

    return Array.from(allMenuIds)
      .sort((a, b) => a - b)
      .map(menuOptionId => ({
        menuOptionId,
        hasAccess: overrideMap.has(menuOptionId)
          ? overrideMap.get(menuOptionId)!
          : rolePerms.some(p => p.menuOptionId === menuOptionId),
      }))
      .filter(p => p.hasAccess);
  }

  public async createUser(data: CreateUserData) {
    const existingUser = await this.findExistingUser(data.email, data.dni);
    if (existingUser) this.throwDuplicateError(existingUser, data);

    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await User.create({
      ...data,
      password: hashedPassword,
      isActive: true,
    });

    await this.createPermissions(newUser.id, data.roleId, data.permissions);

    const userJson = newUser.toJSON();
    delete userJson.password;

    return { user: userJson, temporaryPassword: tempPassword };
  }

  private async findExistingUser(email: string, dni: string) {
    return await User.findOne({ where: { [Op.or]: [{ email }, { dni }] } });
  }

  private throwDuplicateError(existingUser: User, data: CreateUserData) {
    if (existingUser.email === data.email) throw ApiError.emailExists("El correo electrónico ya existe");
    if (existingUser.dni === data.dni) throw ApiError.conflict("El número de documento ya existe");
  }

  private generateTempPassword(): string {
    return `Clini-${Math.random().toString(36).slice(-4)}!`;
  }

  private async createPermissions(userId: number, roleId: number, permissions: number[]) {
    const rolePerms = await RoleMenuPermission.findAll({ where: { roleId } });
    const roleAllowedIds = new Set(rolePerms.map(p => p.menuOptionId));

    const selectedSet = new Set(permissions);

    const toCreate: { userId: number; menuOptionId: number; hasAccess: boolean }[] = [];

    for (const allowedId of roleAllowedIds) {
      if (!selectedSet.has(allowedId)) {
        toCreate.push({ userId, menuOptionId: allowedId, hasAccess: false });
      }
    }

    if (toCreate.length > 0) {
      await UserMenuOverride.bulkCreate(toCreate);
    }
  }

  public async updateUserPermissions(targetUserId: number, permissions: { menuOptionId: number; hasAccess: boolean }[]) {
    const targetUser = await User.findByPk(targetUserId, {
      include: [{ model: Role, as: "roleData" }],
    });

    if (!targetUser) throw ApiError.notFound("Usuario no encontrado");
    if (targetUser.roleData?.code === "ADMIN") throw ApiError.forbidden("No se pueden modificar permisos de administrador");

    await UserMenuOverride.destroy({ where: { userId: targetUserId } });

    const overrideData = permissions.map(p => ({
      userId: targetUserId,
      menuOptionId: p.menuOptionId,
      hasAccess: p.hasAccess,
    }));

    return await UserMenuOverride.bulkCreate(overrideData);
  }

  public async toggleUserStatus(userId: number) {
    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: "roleData" }],
    });

    if (!user) throw ApiError.notFound("Usuario no encontrado");
    if (user.roleData?.code === "ADMIN") throw ApiError.forbidden("No se puede cambiar estado de administrador");

    user.isActive = !user.isActive;
    await user.save();

    return {
      id: user.id,
      isActive: user.isActive,
      message: `Usuario ${user.isActive ? "activado" : "desactivado"} correctamente.`,
    };
  }
}