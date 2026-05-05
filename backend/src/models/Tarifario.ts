import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Tarifario extends Model {
  public id!: number;
  public nombre!: string;
}

Tarifario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "NOMBRE",
    },
  },
  {
    sequelize,
    tableName: "TARIFARIO",
    timestamps: false,
  }
);

export default Tarifario;