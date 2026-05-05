import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Convenio extends Model {
  public idEps!: string;
  public codEps!: string;
  public nombre!: string;
  public direccion!: string;
  public telefono!: string;
  public idTarifario!: number;
  public tipoVariacion!: string;
  public contrato!: string;
  public fechaIniContr!: string;
  public fechaFinContr!: string;
}

Convenio.init(
  {
    idEps: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      field: "ID_EPS",
    },
    codEps: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "COD_EPS",
    },
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: "NOMBRE",
    },
    direccion: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "DIRECCION",
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "TELEFONO",
    },
    idTarifario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_TARIFARIO",
    },
    tipoVariacion: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "TIPO_VARIACION",
    },
    contrato: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "CONTRATO",
    },
    fechaIniContr: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "FECHA_INI_CONTR",
    },
    fechaFinContr: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "FECHA_FIN_CONTR",
    },
  },
  {
    sequelize,
    tableName: "CONVENIO",
    timestamps: false,
  }
);

export default Convenio;