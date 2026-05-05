import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class TipoOrigen extends Model {
  public id!: number;
  public descripcion!: string;
}

TipoOrigen.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    descripcion: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "DESCRIPCION",
    },
  },
  {
    sequelize,
    tableName: "TIPO_ORIGEN",
    timestamps: false,
  }
);

export default TipoOrigen;