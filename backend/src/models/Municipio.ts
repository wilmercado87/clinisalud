import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Departamento from "./Departamento";

class Municipio extends Model {
  public id!: number;
  public dptoId!: string;
  public municipalityId!: number;
  public municipalityName!: string;

  public department?: Departamento;
}

Municipio.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID" },
    dptoId: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "FK_DEPARTAMENTO"
    },
    municipalityId: { type: DataTypes.INTEGER, allowNull: false, unique: true, field: "ID_CODIGO_MUNICIPIO" },
    municipalityName: { type: DataTypes.STRING(150), allowNull: false, field: "NOMBRE_MUNICIPIO" },
  },
  {
    sequelize,
    tableName: "municipio",
    timestamps: false,
    indexes: [
      { fields: ["FK_DEPARTAMENTO"] },
      { fields: ["NOMBRE_MUNICIPIO"] },
      { fields: ["FK_DEPARTAMENTO", "NOMBRE_MUNICIPIO"] },
    ],
  }
);

export default Municipio;
