import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import TipoTriage from "./TipoTriage";
import TipoDocumento from "./TipoDocumento";
import Convenios from "./Convenios";
import Diagnostico from "./Diagnostico";
import User from "./User";

class Triage extends Model {
  public id!: number;
  public priorityTypeId!: number;
  public documentTypeId!: number;
  public documentNumber!: string;
  public attentionDate!: string;
  public epsCode!: string;
  public diagnosticCode!: string;
  public systemUserId!: number;

  public priorityType?: TipoTriage;
  public documentType?: TipoDocumento;
  public eps?: Convenios;
  public diagnostic?: Diagnostico;
  public systemUser?: User;
}

Triage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "pk_id_triage",
    },
    priorityTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_tipo_prioridad",
    },
    documentTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_tipo_documento",
    },
    documentNumber: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "numero_documento",
    },
    attentionDate: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "fecha_atencion",
    },
    epsCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "fk_cod_eps",
    },
    diagnosticCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "fk_codigo_diagnostico",
    },
    systemUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id_usuario_sistema",
    },
  },
  {
    sequelize,
    tableName: "triage",
    timestamps: true,
  },
);

export default Triage;
