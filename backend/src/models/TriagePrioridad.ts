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

  public triageData?: TipoTriage;
}

TriagePrioridad.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    triageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_id_triage",
      references: { model: "tipo_triage", key: "id" },
    },
    priorityType: { type: DataTypes.INTEGER, allowNull: false, field: "tipo_prioridad" },
    ageFrom: { type: DataTypes.INTEGER, allowNull: false, field: "rango_edad_desde" },
    ageTo: { type: DataTypes.INTEGER, allowNull: false, field: "rango_edad_hasta" },
    gender: { type: DataTypes.STRING(5), allowNull: false, field: "sexo" },
  },
  {
    sequelize,
    tableName: "triage_prioridad",
    timestamps: false,
  }
);

export default TriagePrioridad;