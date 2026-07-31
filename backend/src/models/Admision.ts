import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Paciente from "./Paciente";
import Cama from "./Cama";
import Convenio from "./Convenio";
import TipoEstado from "./TipoEstado";
import Usuario from "./Usuario";

class Admision extends Model {
  public admissionNumber!: string;
  public invoiceNumber!: string | null;
  public patientId!: number;
  public admissionDate!: string;
  public roomId?: number;
  public epsId!: number;
  public observations!: string | null;
  public statusId!: number;
  public systemUserId!: number;

  public patient?: Paciente;
  public room?: Cama;
  public eps?: Convenio;
  public admissionStatus?: TipoEstado;
  public systemUser?: Usuario;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Admision.init(
  {
    admissionNumber: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      field: "ID_ADMISION",
    },
    invoiceNumber: {
      type: DataTypes.STRING(50),
      field: "FK_FACTURA",
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_PACIENTE",
    },
    admissionDate: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "FECHA_ADMISION",
    },
    roomId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "ID_HABITACION",
    },
    epsId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "FK_EPS",
    },
    observations: {
      type: DataTypes.TEXT,
      field: "OBSERVACIONES",
    },
    statusId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_TIPO_ESTADO",
    },
    systemUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_USUARIO",
    },
  },
  {
    sequelize,
    tableName: "admision",
    timestamps: true,
    indexes: [
      { fields: ["FK_PACIENTE"] },
      { fields: ["FK_FACTURA"] },
      { fields: ["ID_HABITACION"] },
      { fields: ["FK_EPS"] },
      { fields: ["FK_TIPO_ESTADO"] },
      { fields: ["ID_USUARIO"] },
      { fields: ["FECHA_ADMISION"] },
      { fields: ["FK_PACIENTE", "FECHA_ADMISION"] },
    ],
  },
);

export default Admision;
