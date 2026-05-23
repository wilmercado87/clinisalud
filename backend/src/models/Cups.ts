import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import CentroCosto from "./CentroCosto";
import Tarifarios from "./Tarifarios";
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
  public feeSchedule?: Tarifarios;
  public attentionLevel?: NivelAtencion;
}

Cups.init(
  {
    cupsId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: "pk_id_cups"
    },
    mapiissCode: {
      type: DataTypes.STRING(30),
      field: "pk_codigo_mapiiss"
    },
    mapiissDescription: { type: DataTypes.TEXT, field: "descripcion_mapiiss" },
    uvr: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0, field: "uvr" },
    surgeonValue: { type: DataTypes.BIGINT, defaultValue: 0, field: "vr_cirujano" },
    anesthesiologistValue: { type: DataTypes.BIGINT, defaultValue: 0, field: "vr_anestesiologo" },
    assistantValue: { type: DataTypes.BIGINT, defaultValue: 0, field: "vr_ayudante" },
    roomValue: { type: DataTypes.BIGINT, defaultValue: 0, field: "vr_sala" },
    materialsValue: { type: DataTypes.BIGINT, defaultValue: 0, field: "vr_materiales" },
    netValue: { type: DataTypes.BIGINT, defaultValue: 0, field: "vr_neto" },
    eventType: { type: DataTypes.STRING(50), field: "tipo_evento" },
    costCenterId: {
      type: DataTypes.INTEGER,
      field: "fk_id_centro_costo",
      allowNull: true,
    },
    feeScheduleId: {
      type: DataTypes.INTEGER,
      field: "fk_id_tarifario"
    },
    applyGender: { type: DataTypes.STRING(10), field: "aplica_sexo" },
    eventDescription: { type: DataTypes.STRING(100), field: "descrip_evento" },
    authAmb: { type: DataTypes.STRING(5), field: "aut_amb" },
    authHosp: { type: DataTypes.STRING(5), field: "aut_hosp" },
    maxQuantity: { type: DataTypes.INTEGER, defaultValue: 1, field: "cant_maxima" },
    attentionLevelId: {
      type: DataTypes.INTEGER,
      field: "fk_id_nivel_atencion"
    },
    ripsType: { type: DataTypes.STRING(10), field: "fk_tipo_rips" },
  },
  {
    sequelize,
    tableName: "cups",
    timestamps: false,
    indexes: [
      {
        fields: ["pk_codigo_mapiiss", "fk_id_tarifario"]
      }
    ]
  }
);

export default Cups;