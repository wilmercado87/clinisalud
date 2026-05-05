import Role from "../models/Role";
import MenuOption from "../models/MenuOption"; // 👈 Importa el modelo
import { buildMenuTree } from "../utils/MenuTree.util";

export class RoleService {
  public async findAllRoles() {
    return await Role.findAll({
      order: [["name", "ASC"]],
    });
  }

  public async findAllMenuOptions() {
    const options = await MenuOption.findAll({
      order: [["order", "ASC"]],
    });

    return buildMenuTree(options.map((opt) => opt.get({ plain: true })));
  }
}
