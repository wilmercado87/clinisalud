import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import TipoOrigen from "./TipoOrigen";

class Diagnostico extends Model {
  public id!: number;
  public code!: string;
  public description!: string;
  public originTypeId!: number;
  public applyGender!: string;

  public originTypeData?: TipoOrigen;
}

Diagnostico.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "pk_id_diagnostico" },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true, field: "pk_codigo_diagnostico" },
    description: { type: DataTypes.TEXT, allowNull: false, field: "descripcion_diagnostico" },
    originTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_id_tipo_origen",
      references: { model: "tipo_origen", key: "id" },
    },
    applyGender: { type: DataTypes.STRING(20), allowNull: false, field: "aplica_sexo" },
  },
  {
    sequelize,
    tableName: "diagnostico",
    timestamps: false,
  }
);

export default Diagnostico;