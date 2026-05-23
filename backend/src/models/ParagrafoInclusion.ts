import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Tarifarios from "./Tarifarios";
import Cups from "./Cups";

class ParagrafoInclusion extends Model {
  public id!: number;
  public feeScheduleId!: number;
  public mapiissCode!: string;
  public simpleCode!: string;

  public feeSchedule?: Tarifarios;
  public cups?: Cups;
}

ParagrafoInclusion.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "pk_id_paragrafo_inclusion" },
    feeScheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_id_tarifario"
    },
    mapiissCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "fk_codigo_mapiiss"
    },
    simpleCode: { type: DataTypes.STRING(30), allowNull: false, field: "codigo_simple" },
  },
  {
    sequelize,
    tableName: "paragrafo_inclusion",
    timestamps: false,
  }
);

export default ParagrafoInclusion;