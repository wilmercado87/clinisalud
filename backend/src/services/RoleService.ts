import Role from "../models/Role";
import RoleMenuPermission from "../models/RoleMenuPermission";
import MenuOption from "../models/MenuOption";
import { buildMenuTree } from "../utils/MenuTree.util";

export interface ResolvedPermission {
  menuOptionId: number;
  hasAccess: boolean;
}

export class RoleService {
  public async findAllRoles(): Promise<Role[]> {
    return await Role.findAll({ order: [["name", "ASC"]] });
  }

  public async findRoleWithPermissions(roleId: number): Promise<any> {
    const role = await Role.findByPk(roleId);
    if (!role) return null;

    const permissions = await RoleMenuPermission.findAll({
      where: { roleId },
      include: [{ model: MenuOption, as: "menuOption", attributes: ["id"] }],
    });

    return {
      ...role.toJSON(),
      permissions: permissions.map(p => ({
        menuOptionId: p.menuOptionId,
        hasAccess: true,
      })),
    };
  }

  public async findAllMenuOptions(): Promise<any[]> {
    const options = await MenuOption.findAll({ order: [["order", "ASC"]] });
    return buildMenuTree(options.map(opt => opt.toJSON()));
  }

  public async resolveUserPermissions(roleId: number, userId: number): Promise<ResolvedPermission[]> {
    const rolePerms = await RoleMenuPermission.findAll({ where: { roleId } });
    const overrides = await import("../models/UserMenuOverride").then(m => m.default.findAll({ where: { userId } }));

    const permMap = new Map<number, boolean>();

    for (const rp of rolePerms) {
      permMap.set(rp.menuOptionId, true);
    }
    for (const ov of overrides) {
      permMap.set(ov.menuOptionId, ov.hasAccess);
    }

    return Array.from(permMap.entries()).map(([menuOptionId, hasAccess]) => ({
      menuOptionId,
      hasAccess,
    }));
  }
}

export default new RoleService();