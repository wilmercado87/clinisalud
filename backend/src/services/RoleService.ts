import Role from "../models/Role";
import MenuOption from "../models/MenuOption";
import { buildMenuTree } from "../utils/MenuTree.util";

export class RoleService {
  public async findAllRoles(): Promise<Role[]> {
    return await Role.findAll({ order: [["name", "ASC"]] });
  }

  public async findAllMenuOptions(): Promise<any[]> {
    const options = await MenuOption.findAll({
      where: { isActive: true },
      order: [["order", "ASC"]]
    });
    return buildMenuTree(options.map(opt => opt.toJSON()));
  }
}

export default new RoleService();