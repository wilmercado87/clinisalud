import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class TipoDocumento extends Model {
  public id!: number;
  public code!: string;
  public description!: string;
}

TipoDocumento.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID_TIPO_DOCUMENTO" },
    code: { type: DataTypes.STRING(10), allowNull: false, unique: true, field: "CODIGO_TIPO_DOCUMENTO" },
    description: { type: DataTypes.STRING(150), allowNull: false, field: "DESCRIPCION_TIPO_DOCUMENTO" },
  },
  {
    sequelize,
    tableName: "tipo_documento",
    timestamps: false,
  }
);

export default TipoDocumento;
