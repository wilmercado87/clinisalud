import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class TipoAutorizacion extends Model {
  public id!: number;
  public description!: string;
  public attentionLevelId!: number;
}

TipoAutorizacion.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID_TIPO_AUTORIZACION" },
    description: { type: DataTypes.STRING(100), allowNull: false, field: "DESCRIPCION_TIPO_AUTORIZACION" },
    attentionLevelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_NIVEL_ATENCION",
    },
  },
  {
    sequelize,
    tableName: "tipo_autorizacion",
    timestamps: false,
  }
);

export default TipoAutorizacion;
