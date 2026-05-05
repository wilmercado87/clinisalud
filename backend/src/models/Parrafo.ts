import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Parrafo extends Model {
  public id!: number;
  public idTarifario!: number;
  public codigoCups!: string;
  public tipoParrafo!: string;
}

Parrafo.init(
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
    codigoCups: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "CODIGO_CUPS",
    },
    tipoParrafo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "TIPO_PARRAFO",
    },
  },
  {
    sequelize,
    tableName: "PARRAFO",
    timestamps: false,
    indexes: [
      { fields: ["idTarifario"] },
      { fields: ["codigoCups"] },
    ],
  }
);

export default Parrafo;