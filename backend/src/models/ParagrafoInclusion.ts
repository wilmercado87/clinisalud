import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Tarifarios from "./Tarifarios";
import Cups from "./Cups";

class ParagrafoInclusion extends Model {
  public id!: number;
  public feeScheduleId!: number;
  public mapiissCode!: string;
  public includeType!: string;

  public feeScheduleData?: Tarifarios;
  public cupsData?: Cups;
}

ParagrafoInclusion.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "pk_id_paragrafo_inclusion" },
    feeScheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_id_tarifario",
      references: { model: "tarifarios", key: "id" },
    },
    mapiissCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "fk_codigo_mapiiss",
      references: { model: "cups", key: "mapiissCode" },
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