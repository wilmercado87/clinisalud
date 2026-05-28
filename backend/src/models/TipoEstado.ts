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
      field: "pk_id_tipo_estado",
    },
    description: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "descripcion_tipo_estado",
    },
  },
  {
    sequelize,
    tableName: "tipo_estado",
    timestamps: false,
  },
);

export default TipoEstado;
