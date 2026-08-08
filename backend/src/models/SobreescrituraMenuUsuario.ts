import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Usuario from "./Usuario";
import OpcionMenu from "./OpcionMenu";

class SobreescrituraMenuUsuario extends Model {
  public id!: number;
  public userId!: number;
  public menuOptionId!: number;
  public hasAccess!: boolean;

  public user?: Usuario;
  public menuOption?: OpcionMenu;
}

SobreescrituraMenuUsuario.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID" },
    userId: {
      type: DataTypes.INTEGER,
      field: "FK_USUARIO",
    },
    menuOptionId: {
      type: DataTypes.INTEGER,
      field: "FK_OPCION_MENU",
    },
    hasAccess: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "ACCESO",
    },
  },
  {
    sequelize,
    tableName: "sobreescritura_menu_usuario",
    timestamps: false,
    indexes: [{ unique: true, name: "ux_sobreescritura_usuario_opcion", fields: ["FK_USUARIO", "FK_OPCION_MENU"] }]
  }
);

export default SobreescrituraMenuUsuario;
