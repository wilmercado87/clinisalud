import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Tarifario extends Model {
  public id!: number;
  public name!: string;
}

Tarifario.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID_TARIFARIO" },
    name: { type: DataTypes.STRING(100), allowNull: false, field: "NOMBRE_TARIFARIO" },
  },
  {
    sequelize,
    tableName: "tarifario",
    timestamps: false,
  }
);

export default Tarifario;
