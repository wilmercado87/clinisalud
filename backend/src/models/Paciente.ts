import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import TipoDocumento from "./TipoDocumento";
import TipoUsuario from "./TipoUsuario";
import TipoGenero from "./TipoGenero";
import TipoEstado from "./TipoEstado";
import Usuario from "./Usuario";

class Paciente extends Model {
  public id!: number;
  public documentTypeId!: number;
  public document!: string;
  public firstName!: string;
  public lastName!: string;
  public age!: string;
  public address!: string;
  public phone!: string;
  public email!: string | null;
  public disability!: string;
  public userTypeId!: number;
  public birthDate!: string;
  public genderId!: number;
  public statusId!: number;
  public systemUserId!: number;

  public documentType?: TipoDocumento;
  public userType?: TipoUsuario;
  public gender?: TipoGenero;
  public status?: TipoEstado;
  public systemUser?: Usuario;
}

Paciente.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "ID_PACIENTE",
    },
    documentTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_TIPO_DOCUMENTO",
    },
    document: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "DOCUMENTO_PACIENTE",
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "NOMBRE_PACIENTE",
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "APELLIDO_PACIENTE",
    },
    age: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: "EDAD_PACIENTE",
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "DIRECCION",
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "TELEFONO",
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "CORREO",
    },
    disability: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: "DISCAPACIDAD",
    },
    userTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_TIPO_USUARIO",
    },
    birthDate: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "FECHA_NACIMIENTO",
    },
    genderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_TIPO_GENERO",
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
    tableName: "paciente",
    timestamps: true,
    indexes: [
      { fields: ["FK_TIPO_DOCUMENTO"] },
      { fields: ["FK_TIPO_USUARIO"] },
      { fields: ["FK_TIPO_GENERO"] },
      { fields: ["FK_TIPO_ESTADO"] },
      { fields: ["ID_USUARIO"] },
      { fields: ["DOCUMENTO_PACIENTE"] },
      { fields: ["FK_TIPO_DOCUMENTO", "DOCUMENTO_PACIENTE"], unique: true },
    ],
  },
);

export default Paciente;
