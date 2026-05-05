import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Departamento extends Model {
  public id!: number;
  public idDpto!: string;
  public departamento!: string;
  public codDptoRips!: number;
}

Departamento.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    idDpto: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "ID_DPTO",
    },
    departamento: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "DEPARTAMENTO",
    },
    codDptoRips: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "COD_DPTO_RIPS",
    },
  },
  {
    sequelize,
    tableName: "DEPARTAMENTO",
    timestamps: false,
  }
);

export default Departamento;