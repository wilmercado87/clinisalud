import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Paciente from "./Paciente";
import Camas from "./Camas";
import Convenios from "./Convenios";
import TipoEstado from "./TipoEstado";
import User from "./User";

class Admisiones extends Model {
  public admissionNumber!: string;
  public invoiceNumber!: string | null;
  public documentPatient!: string;
  public admissionDate!: string;
  public roomId!: number;
  public bedCode!: string;
  public epsCode!: string;
  public epsName!: string;
  public observations!: string | null;
  public statusId!: number;
  public systemUserId!: number;

  public patient?: Paciente;
  public room?: Camas;
  public eps?: Convenios;
  public admissionStatus?: TipoEstado;
  public systemUser?: User;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Admisiones.init(
  {
    admissionNumber: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      field: "pk_numero_admision",
    },
    invoiceNumber: {
      type: DataTypes.STRING(50),
      field: "fk_numero_factura",
    },
    documentPatient: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "fk_documento_paciente",
    },
    admissionDate: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "fecha_admision",
    },
    roomId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "pk_id_habitacion",
    },
    bedCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "codigo_cama",
    },
    epsCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "fk_cod_eps",
    },
    epsName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "nombre_eps",
    },
    observations: {
      type: DataTypes.TEXT,
      field: "observaciones_admision",
    },
    statusId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_id_tipo_estado",
    },
    systemUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id_usuario_sistema",
    },
  },
  {
    sequelize,
    tableName: "admisiones",
    timestamps: true,
  },
);

export default Admisiones;
