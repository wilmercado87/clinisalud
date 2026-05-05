import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class ParrafoEdad extends Model {
  public id!: number;
  public idTarifario!: number;
  public codigoCups!: string;
  public rangoDesde!: number;
  public rangoHasta!: number;
}

ParrafoEdad.init(
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
    rangoDesde: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "RANGO_DESDE",
    },
    rangoHasta: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "RANGO_HASTA",
    },
  },
  {
    sequelize,
    tableName: "PARRAFO_EDAD",
    timestamps: false,
    indexes: [
      { fields: ["idTarifario"] },
      { fields: ["codigoCups"] },
    ],
  }
);

export default ParrafoEdad;