import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Rol from "./Rol";
import TipoDocumento from "./TipoDocumento";
import SobreescrituraMenuUsuario from "./SobreescrituraMenuUsuario";

class Usuario extends Model {
  public id!: number;
  public firstName!: string;
  public lastName!: string;
  public documentTypeId!: number;
  public dni!: string;
  public email!: string;
  public password!: string;
  public phone!: string;
  public address!: string;
  public isActive!: boolean;
  public roleId!: number;

  public roleData?: Rol;
  public documentTypeData?: TipoDocumento;
  public menuOverrides?: SobreescrituraMenuUsuario[];

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Usuario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "ID",
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "NOMBRE",
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "APELLIDO",
    },
    documentTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_TIPO_DOCUMENTO"
    },
    dni: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "DNI",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "EMAIL",
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "CONTRASENA",
    },
    phone: {
      type: DataTypes.STRING,
      field: "TELEFONO",
    },
    address: {
      type: DataTypes.STRING,
      field: "DIRECCION",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "ACTIVO",
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_ROL",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "FECHA_CREACION",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "FECHA_ACTUALIZACION",
    },
  },
  {
    sequelize,
    tableName: "usuario",
    timestamps: true,
    indexes: [
      { fields: ["FK_TIPO_DOCUMENTO"] },
      { fields: ["FK_ROL"] },
      { fields: ["FK_ROL", "ACTIVO"] },
    ],
  },
);

export default Usuario;
