import * as bcrypt from "bcryptjs";
import { Op } from "sequelize";
import Usuario from "../../models/Usuario";
import Rol from "../../models/Rol";
import OpcionMenu from "../../models/OpcionMenu";
import SobreescrituraMenuUsuario from "../../models/SobreescrituraMenuUsuario";
import PermisoRolMenu from "../../models/PermisoRolMenu";
import { ApiError } from "../../middlewares/ErrorHandlerMiddleware";
import { ERROR_MESSAGES } from "../../constants";
import TipoDocumento from "../../models/TipoDocumento";
import { buildMenuTree } from "../../utils/MenuTree.util";
import { NotificationsService } from "../notifications/notifications.service";

interface CreateUserData {
  email: string;
  dni: string;
  documentTypeId: number;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  roleId: number;
  permissions: number[];
}

export class UsersService {
  private readonly notificationsService = new NotificationsService();
  public async findAllRoles(): Promise<Rol[]> {
    return await Rol.findAll({ order: [["name", "ASC"]] });
  }

  public async findAllMenuOptions(): Promise<any[]> {
    const options = await OpcionMenu.findAll({
      where: { isActive: true },
      order: [["order", "ASC"]]
    });
    return buildMenuTree(options.map(opt => opt.toJSON()));
  }

  public async findAllManageableUsers() {
    const users = await Usuario.findAll({
      attributes: { exclude: ["password"] },
      include: [
        { model: Rol, as: "roleData", attributes: ["id", "name", "code"] },
        { model: SobreescrituraMenuUsuario, as: "menuOverrides" },
      ],
      order: [["createdAt", "DESC"]],
    });

    const roleIds = [...new Set(users.map(u => (u.toJSON() as any).roleData?.id).filter(Boolean))];
    const allRolePerms = roleIds.length > 0
      ? await PermisoRolMenu.findAll({ where: { roleId: roleIds } })
      : [];

    const permsByRole = new Map<number, PermisoRolMenu[]>();
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

  private resolvePermissionsFromArrays(rolePerms: PermisoRolMenu[], overrides: any[]): { menuOptionId: number; hasAccess: boolean }[] {
    const overrideMap = new Map<number, boolean>(
      overrides.map(o => [Number(o.menuOptionId), Boolean(o.hasAccess)])
    );

    const allMenuIds = new Set<number>([
      ...rolePerms.map(p => Number(p.menuOptionId)),
      ...overrides.map(o => Number(o.menuOptionId)),
    ]);

    return Array.from(allMenuIds)
      .sort((a, b) => a - b)
      .map(menuOptionId => ({
        menuOptionId,
        hasAccess: overrideMap.has(menuOptionId)
          ? overrideMap.get(menuOptionId)!
          : rolePerms.some(p => Number(p.menuOptionId) === menuOptionId),
      }))
      .filter(p => p.hasAccess);
  }

  public async createUser(data: CreateUserData, requestingUserRole: string, requestingUserId: number, requestingUserName: string) {
      const targetRole = await Rol.findByPk(data.roleId);
      const isTargetAdmin = targetRole?.code === "ADMIN" || targetRole?.code === "SUPER_ADMIN";
      if (isTargetAdmin && requestingUserRole !== "SUPER_ADMIN") {
        throw ApiError.forbidden(ERROR_MESSAGES.CREATE_ADMIN_FORBIDDEN);
      }

      const existingUser = await this.findExistingUser(data.email, data.dni);
      if (existingUser) this.throwDuplicateError(existingUser, data);

      const ccDocument = await TipoDocumento.findOne({ where: { code: "CC" } });
      const defaultDocumentTypeId = ccDocument ? ccDocument.id : 3;
      const tempPassword = this.generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const newUser = await Usuario.create({
        ...data,
        documentTypeId: data.documentTypeId || defaultDocumentTypeId,
        password: hashedPassword,
        isActive: true,
      });

      await this.createPermissions(newUser.id, data.roleId, data.permissions);
      const userJson = newUser.toJSON();
      delete userJson.password;

      this.notificationsService.createAndDispatch(
        "USER_CREATED",
        "Nuevo usuario registrado",
        `${requestingUserName} (${requestingUserRole}) creó al usuario ${data.firstName} ${data.lastName} (${targetRole?.name || "Sin rol"})`,
        requestingUserId,
        requestingUserName,
        requestingUserRole,
        "/dashboard/users",
        "Ver usuarios",
      ).catch(() => {});

      return { user: userJson, temporaryPassword: tempPassword };
  }

  private async findExistingUser(email: string, dni: string) {
    return await Usuario.findOne({ where: { [Op.or]: [{ email }, { dni }] } });
  }

  private throwDuplicateError(existingUser: Usuario, data: CreateUserData) {
    if (existingUser.email === data.email) throw ApiError.emailExists(ERROR_MESSAGES.EMAIL_EXISTS);
    if (existingUser.dni === data.dni) throw ApiError.conflict(ERROR_MESSAGES.DNI_EXISTS);
  }

  private generateTempPassword(): string {
    return `Clini-${Math.random().toString(36).slice(-4)}!`;
  }

  private async createPermissions(userId: number, roleId: number, permissions: number[]) {
    const rolePerms = await PermisoRolMenu.findAll({ where: { roleId } });
    const roleAllowedIds = new Set(rolePerms.map(p => p.menuOptionId));

    const selectedSet = new Set(permissions);

    const toCreate: { userId: number; menuOptionId: number; hasAccess: boolean }[] = [];

    for (const allowedId of roleAllowedIds) {
      if (!selectedSet.has(allowedId)) {
        toCreate.push({ userId, menuOptionId: allowedId, hasAccess: false });
      }
    }

    if (toCreate.length > 0) {
      await SobreescrituraMenuUsuario.bulkCreate(toCreate);
    }
  }

  public async updateUserPermissions(
    targetUserId: number,
    permissions: { menuOptionId: number; hasAccess: boolean }[],
    requestingUserRole: string,
  ) {
    const targetUser = await Usuario.findByPk(targetUserId, {
      include: [{ model: Rol, as: "roleData" }],
    });

    if (!targetUser) throw ApiError.notFound(ERROR_MESSAGES.USER_NOT_FOUND);

    const targetCode = targetUser.roleData?.code;
    if (targetCode === "SUPER_ADMIN") {
      throw ApiError.forbidden(ERROR_MESSAGES.PERMISSIONS_SUPER_ADMIN_FORBIDDEN);
    }
    if (targetCode === "ADMIN" && requestingUserRole !== "SUPER_ADMIN") {
      throw ApiError.forbidden(ERROR_MESSAGES.PERMISSIONS_ADMIN_FORBIDDEN);
    }

    await SobreescrituraMenuUsuario.destroy({ where: { userId: targetUserId } });

    const overrideData = permissions.map(p => ({
      userId: targetUserId,
      menuOptionId: p.menuOptionId,
      hasAccess: p.hasAccess,
    }));

    return await SobreescrituraMenuUsuario.bulkCreate(overrideData);
  }

  public async toggleUserStatus(userId: number, requestingUserRole: string, requestingUserId: number, requestingUserName: string) {
    const user = await Usuario.findByPk(userId, {
      include: [{ model: Rol, as: "roleData" }],
    });

    if (!user) throw ApiError.notFound(ERROR_MESSAGES.USER_NOT_FOUND);

    const targetCode = user.roleData?.code;
    if (targetCode === "SUPER_ADMIN") {
      throw ApiError.forbidden(ERROR_MESSAGES.STATUS_SUPER_ADMIN_FORBIDDEN);
    }
    if (targetCode === "ADMIN" && requestingUserRole !== "SUPER_ADMIN") {
      throw ApiError.forbidden(ERROR_MESSAGES.STATUS_ADMIN_FORBIDDEN);
    }

    user.isActive = !user.isActive;
    await user.save();

    const action = user.isActive ? "activado" : "desactivado";
    this.notificationsService.createAndDispatch(
      "USER_TOGGLED",
      `Usuario ${action}`,
      `${requestingUserName} (${requestingUserRole}) ${action} al usuario ${user.firstName} ${user.lastName}`,
      requestingUserId,
      requestingUserName,
      requestingUserRole,
      "/dashboard/users",
      "Ver usuarios",
    ).catch(() => {});

    return {
      id: user.id,
      isActive: user.isActive,
      message: `Usuario ${user.isActive ? "activado" : "desactivado"} correctamente.`,
    };
  }
}
