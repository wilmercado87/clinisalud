import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class ParrafoValor extends Model {
  public id!: number;
  public idTarifario!: number;
  public codArticulo!: number;
  public codigoCups!: string;
  public porcentaje!: number;
  public tipoVariacion!: string;
  public parrafo!: string;
}

ParrafoValor.init(
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
    codArticulo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "COD_ARTICULO",
    },
    codigoCups: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "CODIGO_CUPS",
    },
    porcentaje: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "PORCENTAJE",
    },
    tipoVariacion: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "TIPO_VARIACION",
    },
    parrafo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "PARRAFO",
    },
  },
  {
    sequelize,
    tableName: "PARRAFO_VALOR",
    timestamps: false,
  }
);

export default ParrafoValor;