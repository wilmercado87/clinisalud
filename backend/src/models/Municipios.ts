import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Departamentos from "./Departamentos"; // 👈 Importación del modelo padre

class Municipios extends Model {
  public id!: number;
  public dptoId!: string;
  public municipalityId!: number;
  public municipalityName!: string;

  public department?: Departamentos;
}

Municipios.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    dptoId: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "fk_id_dpto"
    },
    municipalityId: { type: DataTypes.INTEGER, allowNull: false, unique: true, field: "id_municipio" },
    municipalityName: { type: DataTypes.STRING(150), allowNull: false, field: "nombre_municipio" },
  },
  {
    sequelize,
    tableName: "municipios",
    timestamps: false,
  }
);

export default Municipios;