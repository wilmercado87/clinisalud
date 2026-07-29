import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import CentroCosto from "./CentroCosto";
import Tarifario from "./Tarifario";
import NivelAtencion from "./NivelAtencion";

class Cups extends Model {
  public cupsId!: number;
  public mapiissCode!: string;
  public mapiissDescription!: string;
  public uvr!: number;
  public surgeonValue!: number;
  public anesthesiologistValue!: number;
  public assistantValue!: number;
  public roomValue!: number;
  public materialsValue!: number;
  public netValue!: number;
  public eventType!: string;
  public costCenterId!: number;
  public feeScheduleId!: number;
  public applyGender!: string;
  public eventDescription!: string;
  public authAmb!: string;
  public authHosp!: string;
  public maxQuantity!: number;
  public attentionLevelId!: number;
  public ripsType!: string;

  public costCenter?: CentroCosto;
  public feeSchedule?: Tarifario;
  public attentionLevel?: NivelAtencion;
}

Cups.init(
  {
    cupsId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: "ID_CUPS"
    },
    mapiissCode: {
      type: DataTypes.STRING(30),
      unique: true,
      field: "CODIGO_MAPIISS"
    },
    mapiissDescription: { type: DataTypes.TEXT, field: "DESCRIPCION_MAPIISS" },
    uvr: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0, field: "UVR" },
    surgeonValue: { type: DataTypes.BIGINT, defaultValue: 0, field: "VR_CIRUJANO" },
    anesthesiologistValue: { type: DataTypes.BIGINT, defaultValue: 0, field: "VR_ANESTESIOLOGO" },
    assistantValue: { type: DataTypes.BIGINT, defaultValue: 0, field: "VR_AYUDANTE" },
    roomValue: { type: DataTypes.BIGINT, defaultValue: 0, field: "VR_SALA" },
    materialsValue: { type: DataTypes.BIGINT, defaultValue: 0, field: "VR_MATERIALES" },
    netValue: { type: DataTypes.BIGINT, defaultValue: 0, field: "VR_NETO" },
    eventType: { type: DataTypes.STRING(50), field: "TIPO_EVENTO" },
    costCenterId: {
      type: DataTypes.INTEGER,
      field: "FK_CENTRO_COSTO",
      allowNull: true,
    },
    feeScheduleId: {
      type: DataTypes.INTEGER,
      field: "FK_TARIFARIO"
    },
    applyGender: { type: DataTypes.STRING(10), field: "APLICA_SEXO" },
    eventDescription: { type: DataTypes.STRING(100), field: "DESCRIPCION_EVENTO" },
    authAmb: { type: DataTypes.STRING(5), field: "AUT_AMB" },
    authHosp: { type: DataTypes.STRING(5), field: "AUT_HOSP" },
    maxQuantity: { type: DataTypes.INTEGER, defaultValue: 1, field: "CANT_MAXIMA" },
    attentionLevelId: {
      type: DataTypes.INTEGER,
      field: "FK_NIVEL_ATENCION"
    },
    ripsType: { type: DataTypes.STRING(10), field: "FK_TIPO_RIPS" },
  },
  {
    sequelize,
    tableName: "cups",
    timestamps: false,
    indexes: [
      { fields: ["FK_CENTRO_COSTO"] },
      { fields: ["FK_TARIFARIO"] },
      { fields: ["FK_NIVEL_ATENCION"] },
      { fields: ["FK_TIPO_RIPS"] },
      { fields: ["DESCRIPCION_MAPIISS"] },
      { fields: ["CODIGO_MAPIISS", "FK_TARIFARIO"] },
    ],
  }
);

export default Cups;
