import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import TipoDocumento from "./TipoDocumento";
import TipoUsuario from "./TipoUsuario";
import Convenios from "./Convenios";
import User from "./User";
import Camas from "./Camas";

class Admisiones extends Model {
  public admissionNumber!: string;
  public invoiceNumber!: string | null;
  public documentTypeId!: number;
  public patientFirstName!: string;
  public patientLastName!: string;
  public patientAge!: string;
  public patientAddress!: string;
  public patientPhone!: string;
  public userTypeId!: number;
  public admissionDate!: string;
  public roomId!: number;
  public bedCode!: string;
  public patientStatus!: string;
  public birthDate!: string;
  public gender!: string;
  public epsCode!: string;
  public epsName!: string;
  public observations!: string | null;
  public companionFirstName!: string | null;
  public companionLastName!: string | null;
  public companionDocumentType!: string | null;
  public companionIdNumber!: string | null;
  public companionAddress!: string | null;
  public relationship!: string | null;
  public companionPhone!: string | null;
  public companionNotes!: string | null;
  public systemUserId!: number;

  public room?: Camas;
  public documentTypeData?: TipoDocumento;
  public userTypeData?: TipoUsuario;
  public eps?: Convenios;
  public systemUser?: User;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Admisiones.init(
  {
    admissionNumber: { type: DataTypes.STRING(50), primaryKey: true, field: "pk_numero_admision" },
    invoiceNumber: { type: DataTypes.STRING(50), field: "fk_numero_factura" },
    documentTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_id_tipo_documento",
    },
    patientFirstName: { type: DataTypes.STRING(100), allowNull: false, field: "nombre_paciente" },
    patientLastName: { type: DataTypes.STRING(100), allowNull: false, field: "apellido_paciente" },
    patientAge: { type: DataTypes.STRING(10), allowNull: false, field: "edad_paciente" },
    patientAddress: { type: DataTypes.STRING(255), allowNull: false, field: "direccion_paciente" },
    patientPhone: { type: DataTypes.STRING(50), allowNull: false, field: "telefono_paciente" },
    userTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_id_tipo_usuario",
    },
    admissionDate: { type: DataTypes.STRING(30), allowNull: false, field: "fecha_ingreso" },
    roomId: { type: DataTypes.INTEGER, allowNull: false, field: "pk_id_habitacion" },
    bedCode: { type: DataTypes.STRING(20), allowNull: false, field: "codigo_cama" },
    patientStatus: { type: DataTypes.STRING(50), allowNull: false, field: "estado_paciente" },
    birthDate: { type: DataTypes.STRING(30), allowNull: false, field: "fecha_nacimiento" },
    gender: { type: DataTypes.STRING(10), allowNull: false, field: "sexo" },
    epsCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "fk_cod_eps",
    },
    epsName: { type: DataTypes.STRING(150), allowNull: false, field: "nombre_eps" },
    observations: { type: DataTypes.TEXT, field: "observaciones_admision_paciente" },
    companionFirstName: { type: DataTypes.STRING(100), field: "nombre_acompanante" },
    companionLastName: { type: DataTypes.STRING(100), field: "apellido_acompanante" },
    companionDocumentType: { type: DataTypes.STRING(10), field: "tipo_doc_acompanante" },
    companionIdNumber: { type: DataTypes.STRING(30), field: "identificacion_acompanante" },
    companionAddress: { type: DataTypes.STRING(255), field: "direccion_aconpanante" },
    relationship: { type: DataTypes.STRING(50), field: "parentesco" },
    companionPhone: { type: DataTypes.STRING(50), field: "telefono_acompanante" },
    companionNotes: { type: DataTypes.TEXT, field: "observacion_acompanante" },
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
  }
);

export default Admisiones;