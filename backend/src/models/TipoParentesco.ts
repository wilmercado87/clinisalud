import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class TipoParentesco extends Model {
  public id!: number;
  public description!: string;
}

TipoParentesco.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "ID_TIPO_PARENTESCO",
    },
    description: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "DESCRIPCION_PARENTESCO",
    },
  },
  {
    sequelize,
    tableName: "tipo_parentesco",
    timestamps: false,
  }
);

export default TipoParentesco;
