import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import TipoOrigen from "./TipoOrigen";

class Diagnostico extends Model {
  public id!: number;
  public code!: string;
  public description!: string;
  public originTypeId!: number;
  public applyGender!: string;

  public originType?: TipoOrigen;
}

Diagnostico.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID_DIAGNOSTICO" },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true, field: "CODIGO_DIAGNOSTICO" },
    description: { type: DataTypes.TEXT, allowNull: false, field: "DESCRIPCION_DIAGNOSTICO" },
    originTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_TIPO_ORIGEN"
    },
    applyGender: { type: DataTypes.STRING(20), allowNull: false, field: "APLICA_SEXO" },
  },
  {
    sequelize,
    tableName: "diagnostico",
    timestamps: false,
    indexes: [
      { fields: ["FK_TIPO_ORIGEN"] },
      { fields: ["DESCRIPCION_DIAGNOSTICO"] },
    ],
  }
);

export default Diagnostico;
