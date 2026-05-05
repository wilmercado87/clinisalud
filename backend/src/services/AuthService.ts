import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Role from "../models/Role";
import MenuOption from "../models/MenuOption";
import UserMenuOverride from "../models/UserMenuOverride";
import RoleMenuPermission from "../models/RoleMenuPermission";
import { buildMenuTree } from "../utils/MenuTree.util";

export class AuthService {
  public async login(email: string, pass: string) {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: "roleData" }],
    });

    if (!user) throw new Error("401");
    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) throw new Error("402");
    if (!user.isActive) throw new Error("403");

    const menu = await this.getAuthorizedMenu(user.id, user.roleId);

    const token = this.generateToken(user);
    const userJson = user.get({ plain: true });
    delete userJson.password;

    return {
      user: {
        ...userJson,
        role: user.roleData?.code,
      },
      menu,
      token,
    };
  }

  private async getAuthorizedMenu(userId: number, roleId: number) {
    // 1. Buscamos el código del rol primero
    const role = await Role.findByPk(roleId);
    const roleCode = role?.code || "USER";

    const rolePermissions = await RoleMenuPermission.findAll({
      where: { roleId },
    });

    const authorizedIds = new Set<number>(
      rolePermissions.map((p) => p.menuOptionId),
    );

    const overrides = await UserMenuOverride.findAll({ where: { userId } });

    overrides.forEach((ov) => {
      if (ov.hasAccess) {
        authorizedIds.add(ov.menuOptionId);
      } else {
        authorizedIds.delete(ov.menuOptionId);
      }
    });

    if (roleCode === "ADMIN") {
      const gestorOption = await MenuOption.findOne({
        where: { label: "Gestor Usuarios" },
      });
      if (gestorOption) {
        authorizedIds.add(gestorOption.id);
      }
    }

    if (authorizedIds.size === 0) return [];

    const authorizedOptions = await MenuOption.findAll({
      where: { id: Array.from(authorizedIds) },
      order: [["order", "ASC"]],
    });

    const allOptionsMap = new Map<number, any>();
    authorizedOptions.forEach((opt) =>
      allOptionsMap.set(opt.id, opt.get({ plain: true })),
    );

    await this.ensureParentHierarchy(allOptionsMap);

    return buildMenuTree(Array.from(allOptionsMap.values()));
  }

  private async ensureParentHierarchy(map: Map<number, any>) {
    const parentIdsMissing = Array.from(map.values())
      .filter((opt) => opt.parentId && !map.has(opt.parentId))
      .map((opt) => opt.parentId as number);

    if (parentIdsMissing.length > 0) {
      const missingParents = await MenuOption.findAll({
        where: { id: parentIdsMissing },
      });

      missingParents.forEach((p) => map.set(p.id, p.get({ plain: true })));

      await this.ensureParentHierarchy(map);
    }
  }

  private generateToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        role: user.roleData?.code,
        email: user.email,
      },
      process.env["JWT_SECRET"] || "clinisalud_secret",
      { expiresIn: "24h" },
    );
  }
}
