import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import TipoTriage from "./TipoTriage";
import Convenio from "./Convenio";
import Diagnostico from "./Diagnostico";
import Usuario from "./Usuario";
import Paciente from "./Paciente";

class Triage extends Model {
  public id!: number;
  public priorityTypeId!: number;
  public pacienteId!: number;
  public attentionDate!: string;
  public epsId!: number;
  public diagnosticId!: number;
  public systemUserId!: number;

  public priorityType?: TipoTriage;
  public paciente?: Paciente;
  public eps?: Convenio;
  public diagnostic?: Diagnostico;
  public systemUser?: Usuario;
}

Triage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "ID_TRIAGE",
    },
    priorityTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_TIPO_PRIORIDAD",
    },
    pacienteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_PACIENTE",
    },
    attentionDate: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "FECHA_ATENCION",
    },
    epsId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "FK_COD_EPS",
    },
    diagnosticId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_CODIGO_DIAGNOSTICO",
    },
    systemUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_USUARIO",
    },
  },
  {
    sequelize,
    tableName: "triage",
    timestamps: true,
  },
);

export default Triage;
