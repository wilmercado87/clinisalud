import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Role from "../models/Role";
import MenuOption from "../models/MenuOption";
import UserMenuOverride from "../models/UserMenuOverride";
import RoleMenuPermission from "../models/RoleMenuPermission";
import { buildMenuTree } from "../utils/MenuTree.util";
import { JWT_CONFIG } from "../constants";
import { ApiError } from "../middlewares/ErrorHandlerMiddleware";

export class AuthService {
  public async login(email: string, pass: string) {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: "roleData" }],
    });

    if (!user) throw ApiError.unauthorized("Usuario no encontrado");
    if (!await bcrypt.compare(pass, user.password)) throw ApiError.unauthorized("Credenciales inválidas");
    if (!user.isActive) throw ApiError.forbidden("Usuario inactivo");

    const [menu, token] = await Promise.all([
      this.getAuthorizedMenu(user.id, user.roleId),
      this.generateToken(user),
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
    const role = await Role.findByPk(roleId);
    const isAdmin = role?.code === "ADMIN";

    const [rolePermissions, overrides] = await Promise.all([
      RoleMenuPermission.findAll({ where: { roleId } }),
      UserMenuOverride.findAll({ where: { userId } }),
    ]);

    const authorizedIds = new Set(rolePermissions.map(p => p.menuOptionId));

    for (const ov of overrides) {
      ov.hasAccess ? authorizedIds.add(ov.menuOptionId) : authorizedIds.delete(ov.menuOptionId);
    }

    if (isAdmin) {
      const gestorOption = await MenuOption.findOne({ where: { label: "Gestor Usuarios" } });
      if (gestorOption) authorizedIds.add(gestorOption.id);
    }

    if (authorizedIds.size === 0) return [];

    const authorizedOptions = await MenuOption.findAll({
      where: { id: Array.from(authorizedIds) },
      order: [["order", "ASC"]],
    });

    const menuMap = this.buildOptionMap(authorizedOptions);
    await this.ensureParentHierarchy(menuMap);

    return buildMenuTree(Array.from(menuMap.values()));
  }

  private buildOptionMap(options: MenuOption[]) {
    const map = new Map<number, ReturnType<MenuOption['get']>>();
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

    const missingParents = await MenuOption.findAll({ where: { id: parentIdsMissing } });
    for (const parent of missingParents) {
      map.set(parent.id, parent.get({ plain: true }));
    }

    await this.ensureParentHierarchy(map);
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { id: user.id, role: user.roleData?.code, email: user.email },
      process.env["JWT_SECRET"] || "clinisalud_secret",
      { expiresIn: JWT_CONFIG.EXPIRES_IN }
    );
  }
}

export default new AuthService();