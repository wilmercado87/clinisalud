import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class TipoOrigen extends Model {
  public id!: number;
  public description!: string;
}

TipoOrigen.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "pk_id_tipo_origen" },
    description: { type: DataTypes.STRING(150), allowNull: false, field: "descripcion_tipo_origen" },
  },
  {
    sequelize,
    tableName: "tipo_origen",
    timestamps: false,
  }
);

export default TipoOrigen;