import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class ParrafoAplicacion extends Model {
  public id!: number;
  public idTarifario!: number;
  public codigoCups!: string;
  public codigoDiagnostico!: string;
}

ParrafoAplicacion.init(
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
    codigoDiagnostico: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "CODIGO_DIAGNOSTICO",
    },
  },
  {
    sequelize,
    tableName: "PARRAFO_APLICACION",
    timestamps: false,
  }
);

export default ParrafoAplicacion;