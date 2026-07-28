import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class TipoOrigen extends Model {
  public id!: number;
  public description!: string;
}

TipoOrigen.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID_TIPO_ORIGEN" },
    description: { type: DataTypes.STRING(150), allowNull: false, field: "DESCRIPCION_TIPO_ORIGEN" },
  },
  {
    sequelize,
    tableName: "tipo_origen",
    timestamps: false,
  }
);

export default TipoOrigen;
