import Role from "../models/Role";
import { Op } from "sequelize";

export class RoleService {
  public async findAllRoles() {
    return await Role.findAll({
      order: [["name", "ASC"]]
    });
  }
}