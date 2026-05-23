import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class TipoDocumento extends Model {
  public id!: number;
  public code!: string;
  public description!: string;
}

TipoDocumento.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "pk_id_tipo_documento" },
    code: { type: DataTypes.STRING(10), allowNull: false, unique: true, field: "pk_tipo_documento" },
    description: { type: DataTypes.STRING(150), allowNull: false, field: "descripcion_documento" },
  },
  {
    sequelize,
    tableName: "tipo_documento",
    timestamps: false,
  }
);

export default TipoDocumento;