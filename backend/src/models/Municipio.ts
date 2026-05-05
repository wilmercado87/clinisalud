import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Departamento from "./Departamento";

class Municipio extends Model {
  public id!: number;
  public idDpto!: string;
  public idMunicipio!: string;
  public municipio!: string;
  public codMunicipioRips!: string;

  public departamento?: Departamento;
}

Municipio.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    idDpto: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "ID_DPTO",
    },
    idMunicipio: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: "ID_MUNICIPIO",
    },
    municipio: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "MUNICIPIO",
    },
    codMunicipioRips: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: "COD_MUNICIPIO_RIPS",
    },
  },
  {
    sequelize,
    tableName: "MUNICIPIO",
    timestamps: false,
  }
);

Municipio.belongsTo(Departamento, {
  foreignKey: "ID_DPTO",
  as: "departamento",
});

export default Municipio;