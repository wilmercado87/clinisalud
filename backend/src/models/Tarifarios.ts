import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Tarifarios extends Model {
  public id!: number;
  public name!: string;
}

Tarifarios.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "pk_id_tarifario" },
    name: { type: DataTypes.STRING(100), allowNull: false, field: "nombre_tarifario" },
  },
  {
    sequelize,
    tableName: "tarifarios",
    timestamps: false,
  }
);

export default Tarifarios;