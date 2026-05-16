import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class RoleMenuPermission extends Model {
  public id!: number;
  public roleId!: number;
  public menuOptionId!: number;
}

RoleMenuPermission.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    roleId: { type: DataTypes.INTEGER, field: "role_id" },
    menuOptionId: { type: DataTypes.INTEGER, field: "menu_option_id" }
  },
  {
    sequelize,
    tableName: "role_menu_permissions",
    timestamps: false,
    indexes: [{ unique: true, fields: ["role_id", "menu_option_id"] }]
  }
);

export default RoleMenuPermission;