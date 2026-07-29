import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import TipoTriage from "./TipoTriage";

class TriagePrioridad extends Model {
  public id!: number;
  public triageId!: number;
  public priorityType!: number;
  public ageFrom!: number;
  public ageTo!: number;
  public gender!: string;

  public triage?: TipoTriage;
}

TriagePrioridad.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID" },
    triageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_TIPO_TRIAGE",
    },
    priorityType: { type: DataTypes.INTEGER, allowNull: false, field: "TIPO_PRIORIDAD" },
    ageFrom: { type: DataTypes.INTEGER, allowNull: false, field: "RANGO_EDAD_DESDE" },
    ageTo: { type: DataTypes.INTEGER, allowNull: false, field: "RANGO_EDAD_HASTA" },
    gender: { type: DataTypes.STRING(5), allowNull: false, field: "SEXO" },
  },
  {
    sequelize,
    tableName: "triage_prioridad",
    timestamps: false,
    indexes: [
      { fields: ["FK_TIPO_TRIAGE"] },
      { fields: ["TIPO_PRIORIDAD"] },
    ],
  }
);

export default TriagePrioridad;
