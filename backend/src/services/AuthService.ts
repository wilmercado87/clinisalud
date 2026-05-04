import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Role from "../models/Role";
import MenuOption from "../models/MenuOption";
import UserMenuOverride from "../models/UserMenuOverride";
import RoleMenuPermission from "../models/RoleMenuPermission";

export class AuthService {
  public async login(email: string, pass: string) {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: "roleData" }],
    });

    if (!user) {
      throw new Error("401");
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);

    if (!isPasswordValid) {
      throw new Error("402");
    }

    if (!user.isActive) {
      throw new Error("403");
    }

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

    if (authorizedIds.size === 0) return [];

    const authorizedOptions = await MenuOption.findAll({
      where: { id: Array.from(authorizedIds) },
      order: [["order", "ASC"]],
    });

    const allOptionsMap = new Map<number, any>();

    authorizedOptions.forEach((opt) =>
      allOptionsMap.set(opt.id, opt.get({ plain: true })),
    );

    const parentIdsMissing = authorizedOptions
      .filter((opt) => opt.parentId && !allOptionsMap.has(opt.parentId))
      .map((opt) => opt.parentId as number);

    if (parentIdsMissing.length > 0) {
      const missingParents = await MenuOption.findAll({
        where: { id: parentIdsMissing },
      });
      missingParents.forEach((p) =>
        allOptionsMap.set(p.id, p.get({ plain: true })),
      );
    }

    return this.buildMenuTree(Array.from(allOptionsMap.values()));
  }

  private buildMenuTree(options: any[]): any[] {
    const map = new Map<number, any>();
    const tree: any[] = [];

    options.sort((a, b) => (a.order || 0) - (b.order || 0));

    options.forEach((opt) => {
      map.set(opt.id, { ...opt, children: [] });
    });

    options.forEach((opt) => {
      const node = map.get(opt.id);
      if (opt.parentId && map.has(opt.parentId)) {
        map.get(opt.parentId).children.push(node);
      } else if (!opt.parentId) {
        tree.push(node);
      }
    });

    return tree;
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
