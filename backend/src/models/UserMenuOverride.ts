import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class UserMenuOverride extends Model {
  public id!: number;
  public userId!: number;
  public menuOptionId!: number;
  public hasAccess!: boolean;
}

UserMenuOverride.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: {
      type: DataTypes.INTEGER,
      field: "user_id",
    },
    menuOptionId: {
      type: DataTypes.INTEGER,
      field: "menu_option_id",
    },
    hasAccess: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "has_access",
    },
  },
  {
    sequelize,
    tableName: "user_menu_overrides",
    timestamps: false,
    indexes: [{ unique: true, fields: ["user_id", "menu_option_id"] }]
  },
);

export default UserMenuOverride;
