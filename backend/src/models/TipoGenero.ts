import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class TipoGenero extends Model {
  public id!: number;
  public description!: string;
}

TipoGenero.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "ID_TIPO_GENERO",
    },
    description: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "DESCRIPCION_TIPO_GENERO",
    },
  },
  {
    sequelize,
    tableName: "tipo_genero",
    timestamps: false,
  },
);

export default TipoGenero;
