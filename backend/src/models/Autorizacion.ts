import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Admision from "./Admision";
import TipoAutorizacion from "./TipoAutorizacion";
import Cups from "./Cups";
import Tarifario from "./Tarifario";
import Usuario from "./Usuario";

class Autorizacion extends Model {
  public id!: number;
  public admissionNumber!: string;
  public authTypeId!: number;
  public authNumber!: string;
  public mapiissCode!: string;
  public quantity!: number;
  public feeScheduleId!: number;
  public systemUserId!: number;

  public admission?: Admision;
  public authType?: TipoAutorizacion;
  public cups?: Cups;
  public feeSchedule?: Tarifario;
  public systemUser?: Usuario;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Autorizacion.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID" },
    admissionNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "FK_ADMISION"
    },
    authTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_TIPO_AUTORIZACION",
    },
    authNumber: { type: DataTypes.STRING(50), allowNull: false, field: "NUMERO_AUTORIZACION" },
    mapiissCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "FK_CODIGO_MAPIISS",
    },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1, field: "CANTIDAD" },
    feeScheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_TARIFARIO",
    },
    systemUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_USUARIO",
    },
  },
  {
    sequelize,
    tableName: "autorizacion",
    timestamps: true,
    indexes: [
      { fields: ["FK_ADMISION"] },
      { fields: ["FK_TIPO_AUTORIZACION"] },
      { fields: ["FK_CODIGO_MAPIISS"] },
      { fields: ["FK_TARIFARIO"] },
      { fields: ["ID_USUARIO"] },
      { fields: ["NUMERO_AUTORIZACION"] },
      { fields: ["FK_ADMISION", "FK_CODIGO_MAPIISS"] },
      { 
        fields: ["FK_ADMISION", "FK_TIPO_AUTORIZACION", "FK_CODIGO_MAPIISS", "FK_TARIFARIO"], 
        unique: true,
        name: "uq_autorizacion_adm_tipo_cups_tarifario"
      },
    ],
  }
);

export default Autorizacion;
