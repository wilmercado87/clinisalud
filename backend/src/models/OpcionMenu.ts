import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class OpcionMenu extends Model {
  public id!: number;
  public label!: string;
  public icon!: string;
  public path!: string | null;
  public order!: number;
  public parentId!: number | null;
  public isActive!: boolean;

  public parent?: OpcionMenu;
  public children?: OpcionMenu[];
}

OpcionMenu.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "ID",
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "LABEL",
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "ICONO",
    },
    path: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "RUTA",
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "ORDEN",
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "ID_PADRE"
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "ACTIVO",
    },
  },
  {
    sequelize,
    tableName: "opcion_menu",
    timestamps: false,
  },
);

export default OpcionMenu;
