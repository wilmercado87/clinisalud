import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Usuario from "../../models/Usuario";
import Rol from "../../models/Rol";
import OpcionMenu from "../../models/OpcionMenu";
import SobreescrituraMenuUsuario from "../../models/SobreescrituraMenuUsuario";
import PermisoRolMenu from "../../models/PermisoRolMenu";
import { buildMenuTree } from "../../utils/MenuTree.util";
import { JWT_CONFIG } from "../../constants";
import { ApiError } from "../../middlewares/ErrorHandlerMiddleware";

export class AuthService {

  public async login(email: string, pass: string) {
    const user = await Usuario.findOne({
      where: { email },
      include: [{ model: Rol, as: "roleData" }],
    });

    if (!user) throw ApiError.unauthorized("Usuario no encontrado");
    if (!await bcrypt.compare(pass, user.password)) throw ApiError.unauthorized("Credenciales inválidas");
    if (!user.isActive) throw ApiError.forbidden("Usuario inactivo");

    const tokenPromise = Promise.resolve(this.generateToken(user));
    const [menu, token] = await Promise.all([
      this.getAuthorizedMenu(user.id, user.roleId),
      tokenPromise,
    ]);

    const userJson = user.toJSON();
    delete userJson.password;

    return {
      user: { ...userJson, role: user.roleData?.code },
      menu,
      token,
    };
  }

  private async getAuthorizedMenu(userId: number, roleId: number) {
    const role = await Rol.findByPk(roleId);
    const isAdmin = role?.code === "ADMIN" || role?.code === "SUPER_ADMIN";

    const [rolePermissions, overrides] = await Promise.all([
      PermisoRolMenu.findAll({ where: { roleId } }),
      SobreescrituraMenuUsuario.findAll({ where: { userId } }),
    ]);

    const authorizedIds = new Set(rolePermissions.map(p => p.menuOptionId));

    for (const ov of overrides) {
      if (ov.hasAccess) {
        authorizedIds.add(ov.menuOptionId);
      } else {
        authorizedIds.delete(ov.menuOptionId);
      }
    }

    if (isAdmin) {
      const gestorOption = await OpcionMenu.findOne({ where: { label: "Gestor Usuarios" } });
      if (gestorOption) authorizedIds.add(gestorOption.id);
    }

    if (authorizedIds.size === 0) return [];

    const authorizedOptions = await OpcionMenu.findAll({
      where: { id: Array.from(authorizedIds) },
      order: [["order", "ASC"]],
    });

    const menuMap = this.buildOptionMap(authorizedOptions);
    await this.ensureParentHierarchy(menuMap);

    return buildMenuTree(Array.from(menuMap.values()));
  }

  private buildOptionMap(options: OpcionMenu[]) {
    const map = new Map<number, ReturnType<OpcionMenu['get']>>();
    for (const opt of options) {
      map.set(opt.id, opt.get({ plain: true }));
    }
    return map;
  }

  private async ensureParentHierarchy(map: Map<number, any>) {
    const parentIdsMissing = Array.from(map.values())
      .filter(opt => opt.parentId && !map.has(opt.parentId))
      .map(opt => opt.parentId as number);

    if (parentIdsMissing.length === 0) return;

    const missingParents = await OpcionMenu.findAll({ where: { id: parentIdsMissing } });
    for (const parent of missingParents) {
      map.set(parent.id, parent.get({ plain: true }));
    }

    await this.ensureParentHierarchy(map);
  }

  public async updateProfile(userId: number, data: Partial<{ firstName: string; lastName: string; phone: string; address: string }>) {
    const user = await Usuario.findByPk(userId);
    if (!user) throw ApiError.notFound("Usuario no encontrado");

    const allowedFields: (keyof typeof data)[] = ["firstName", "lastName", "phone", "address"];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        (user as any)[field] = data[field];
      }
    }

    await user.save();
    const userJson = user.toJSON();
    delete userJson.password;
    return userJson;
  }

  public async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await Usuario.findByPk(userId);
    if (!user) throw ApiError.notFound("Usuario no encontrado");

    if (!await bcrypt.compare(currentPassword, user.password)) {
      throw ApiError.badRequest("La contraseña actual no es correcta");
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      throw ApiError.badRequest("La nueva contraseña debe ser diferente a la actual");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return { message: "Contraseña actualizada correctamente" };
  }

  private generateToken(user: Usuario): string {
    return jwt.sign(
      { id: user.id, role: user.roleData?.code, email: user.email },
      process.env["JWT_SECRET"] || "clinisalud_secret",
      { expiresIn: JWT_CONFIG.EXPIRES_IN }
    );
  }
}
