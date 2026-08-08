import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Rol from "./Rol";
import OpcionMenu from "./OpcionMenu";

class PermisoRolMenu extends Model {
  public id!: number;
  public roleId!: number;
  public menuOptionId!: number;

  public role?: Rol;
  public menuOption?: OpcionMenu;
}

PermisoRolMenu.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID" },
    roleId: {
      type: DataTypes.INTEGER,
      field: "FK_ROL",
    },
    menuOptionId: {
      type: DataTypes.INTEGER,
      field: "FK_OPCION_MENU",
    },
  },
  {
    sequelize,
    tableName: "permiso_rol_menu",
    timestamps: false,
    indexes: [{ unique: true, name: "ux_permiso_rol_opcion", fields: ["FK_ROL", "FK_OPCION_MENU"] }],
  }
);

export default PermisoRolMenu;
