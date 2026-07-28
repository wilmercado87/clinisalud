import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Tarifario from "./Tarifario";
import Cups from "./Cups";

class ParagrafoInclusion extends Model {
  public id!: number;
  public feeScheduleId!: number;
  public mapiissCode!: string;
  public simpleCode!: string;

  public feeSchedule?: Tarifario;
  public cups?: Cups;
}

ParagrafoInclusion.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID_PARAGRAFO_INCLUSION" },
    feeScheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_TARIFARIO"
    },
    mapiissCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "FK_CODIGO_MAPIISS"
    },
    simpleCode: { type: DataTypes.STRING(30), allowNull: false, field: "CODIGO_SIMPLE" },
  },
  {
    sequelize,
    tableName: "paragrafo_inclusion",
    timestamps: false,
  }
);

export default ParagrafoInclusion;
