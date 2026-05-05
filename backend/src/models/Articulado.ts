import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Articulado extends Model {
  public id!: number;
  public idTarifario!: number;
  public codArticulo!: number;
  public paragrafo!: string;
  public codigoCups!: string;
  public descripcion!: string;
  public tipoParrafo!: string;
}

Articulado.init(
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
    paragrafo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "PARRAFO",
    },
    codigoCups: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "CODIGO_CUPS",
    },
    descripcion: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: "DESCRIPCION",
    },
    tipoParrafo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "TIPO_PARRAFO",
    },
  },
  {
    sequelize,
    tableName: "ARTICULADO",
    timestamps: false,
  }
);

export default Articulado;