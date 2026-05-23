import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class TipoAutorizacion extends Model {
  public id!: number;
  public description!: string;
}

TipoAutorizacion.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "pk_id_tipo_autorizacion" },
    description: { type: DataTypes.STRING(100), allowNull: false, field: "descripcion_tipo_autorizacion" },
  },
  {
    sequelize,
    tableName: "tipo_autorizacion",
    timestamps: false,
  }
);

export default TipoAutorizacion;