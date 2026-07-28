import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class TipoEstado extends Model {
  public id!: number;
  public description!: string;
}

TipoEstado.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "ID_TIPO_ESTADO",
    },
    description: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "DESCRIPCION_TIPO_ESTADO",
    },
  },
  {
    sequelize,
    tableName: "tipo_estado",
    timestamps: false,
  },
);

export default TipoEstado;
