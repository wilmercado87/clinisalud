import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Contrato extends Model {
  public idEps!: string;
  public nombre!: string;
  public idTarifario!: number;
  public tipoVariacion!: string;
  public porcentajeAmb!: number;
  public porcentajeUrg!: number;
  public porcentajeHosp!: number;
  public contrato!: string;
  public fechaIniContrato!: string;
  public fechaFinContrato!: string;
}

Contrato.init(
  {
    idEps: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      field: "ID_EPS",
    },
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: "NOMBRE",
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
    porcentajeAmb: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "PORCENTAJE_AMB",
    },
    porcentajeUrg: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "PORCENTAJE_URG",
    },
    porcentajeHosp: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "PORCENTAJE_HOSP",
    },
    contrato: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "CONTRATO",
    },
    fechaIniContrato: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "FECHA_INI_CONTRATO",
    },
    fechaFinContrato: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "FECHA_FIN_CONTRATO",
    },
  },
  {
    sequelize,
    tableName: "CONTRATO",
    timestamps: false,
  }
);

export default Contrato;