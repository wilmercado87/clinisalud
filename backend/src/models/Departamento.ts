import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Departamento extends Model {
  public dptoId!: string;
  public id!: number;
  public department!: string;
  public ripsDptoCode!: number;
}

Departamento.init(
  {
    dptoId: {
      type: DataTypes.STRING(30),
      primaryKey: true,
      field: "ID_DPTO",
    },
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      field: "ID",
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "DEPARTAMENTO",
    },
    ripsDptoCode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "COD_DPTO_RIPS",
    },
  },
  {
    sequelize,
    tableName: "departamento",
    timestamps: false,
  },
);

export default Departamento;
