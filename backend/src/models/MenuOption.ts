import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class MenuOption extends Model {
  public id!: number;
  public label!: string;
  public icon!: string;
  public path!: string;
  public order!: number;
  public parentId!: number | null;
}

MenuOption.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: true, // Las opciones que son padres de un acordeón pueden no tener path
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "parent_id",
      references: { model: "menu_options", key: "id" },
    },
  },
  {
    sequelize,
    tableName: "menu_options",
    timestamps: false,
  },
);

// Self-reference para el Acordeón (Padre -> Hijos)
MenuOption.hasMany(MenuOption, { as: "children", foreignKey: "parent_id" });
MenuOption.belongsTo(MenuOption, { as: "parent", foreignKey: "parent_id" });

export default MenuOption;
