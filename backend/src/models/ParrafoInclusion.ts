import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class ParrafoInclusion extends Model {
  public id!: number;
  public idTarifario!: number;
  public codigoCompuesto!: string;
  public codigoSimple!: string;
}

ParrafoInclusion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    idTarifario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_TARIFARIO",
    },
    codigoCompuesto: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "CODIGO_COMPUESTO",
    },
    codigoSimple: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "CODIGO_SIMPLE",
    },
  },
  {
    sequelize,
    tableName: "PARRAFO_INCLUSION",
    timestamps: false,
    indexes: [{ fields: ["idTarifario"] }],
  }
);

export default ParrafoInclusion;