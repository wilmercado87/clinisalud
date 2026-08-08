import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Admision from "./Admision";
import TipoDocumento from "./TipoDocumento";
import TipoParentesco from "./TipoParentesco";

class Acompanante extends Model {
  public id!: number;
  public admissionNumber!: string;
  public firstName!: string;
  public lastName!: string;
  public documentTypeId!: number;
  public document!: string;
  public address!: string;
  public relationshipId!: number;
  public phone!: string;

  public admission?: Admision;
  public documentType?: TipoDocumento;
  public relationship?: TipoParentesco;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Acompanante.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "ID_ACOMPANANTE",
    },
    admissionNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "FK_ADMISION",
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "NOMBRE_ACOMPANANTE",
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "APELLIDO_ACOMPANANTE",
    },
    documentTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_TIPO_DOCUMENTO",
    },
    document: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "DOCUMENTO_ACOMPANANTE",
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "DIRECCION",
    },
    relationshipId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_TIPO_PARENTESCO",
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "TELEFONO",
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
    tableName: "acompanante",
    timestamps: true,
    indexes: [
      { fields: ["FK_ADMISION"] },
      { fields: ["FK_TIPO_DOCUMENTO"] },
      { fields: ["FK_TIPO_PARENTESCO"] },
    ],
  }
);

export default Acompanante;
