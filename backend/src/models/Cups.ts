import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import CentroCosto from "./CentroCosto";
import Tarifarios from "./Tarifarios";
import NivelAtencion from "./NivelAtencion";

class Cups extends Model {
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

  public costCenterData?: CentroCosto;
  public feeScheduleData?: Tarifarios;
  public attentionLevelData?: NivelAtencion;
}

Cups.init(
  {
    mapiissCode: { type: DataTypes.STRING(30), primaryKey: true, field: "pk_codigo_mapiiss" },
    mapiissDescription: { type: DataTypes.TEXT, allowNull: false, field: "descripcion_mapiiss" },
    uvr: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0, field: "uvr" },
    surgeonValue: { type: DataTypes.BIGINT, defaultValue: 0, field: "vr_cirujano" },
    anesthesiologistValue: { type: DataTypes.BIGINT, defaultValue: 0, field: "vr_anestesiologo" },
    assistantValue: { type: DataTypes.BIGINT, defaultValue: 0, field: "vr_ayudante" },
    roomValue: { type: DataTypes.BIGINT, defaultValue: 0, field: "vr_sala" },
    materialsValue: { type: DataTypes.BIGINT, defaultValue: 0, field: "vr_materiales" },
    netValue: { type: DataTypes.BIGINT, defaultValue: 0, field: "vr_neto" },
    eventType: { type: DataTypes.STRING(50), allowNull: false, field: "tipo_evento" },
    costCenterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_id_centro_costo",
      references: { model: "centro_costo", key: "id" },
    },
    feeScheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_id_tarifario",
      references: { model: "tarifarios", key: "id" },
    },
    applyGender: { type: DataTypes.STRING(10), allowNull: false, field: "aplica_sexo" },
    eventDescription: { type: DataTypes.STRING(100), allowNull: false, field: "descrip_evento" },
    authAmb: { type: DataTypes.STRING(5), allowNull: false, field: "aut_amb" },
    authHosp: { type: DataTypes.STRING(5), allowNull: false, field: "aut_hosp" },
    maxQuantity: { type: DataTypes.INTEGER, defaultValue: 1, field: "cant_maxima" },
    attentionLevelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_id_nivel_atencion",
      references: { model: "nivel_atencion", key: "id" },
    },
    ripsType: { type: DataTypes.STRING(10), allowNull: false, field: "fk_tipo_rips" },
  },
  {
    sequelize,
    tableName: "cups",
    timestamps: false,
  }
);

export default Cups;