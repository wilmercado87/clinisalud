import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Tarifarios from "./Tarifarios";
import Cups from "./Cups";

class TipoParagrafo extends Model {
  public id!: number;
  public feeScheduleId!: number;
  public mapiissCode!: string;
  public paragraphType!: string;

  public feeScheduleData?: Tarifarios;
  public cupsData?: Cups;
}

TipoParagrafo.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "pk_id_tipo_paragrafo" },
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
    paragraphType: { type: DataTypes.STRING(100), allowNull: false, field: "tipo_paragrafo" },
  },
  {
    sequelize,
    tableName: "tipo_paragrafo",
    timestamps: false,
  }
);

export default TipoParagrafo;