import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import TipoDocumento from "./TipoDocumento";
import TipoUsuario from "./TipoUsuario";
import TipoGenero from "./TipoGenero";
import TipoEstado from "./TipoEstado";
import User from "./User";

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
  public systemUser?: User;
}

Paciente.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "pk_id_paciente",
    },
    documentTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_id_tipo_documento",
    },
    document: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "pk_documento_paciente",
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "nombre_paciente",
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "apellido_paciente",
    },
    age: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: "edad_paciente",
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "direccion_paciente",
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "telefono_paciente",
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "correo",
    },
    disability: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: "discapacidad",
    },
    userTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_id_tipo_usuario",
    },
    birthDate: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "fecha_nacimiento",
    },
    genderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_id_tipo_genero",
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
    tableName: "paciente",
    timestamps: true,
  },
);

export default Paciente;
