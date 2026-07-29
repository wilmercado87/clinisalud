import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Tarifario from "./Tarifario";
import Cups from "./Cups";

class TipoParagrafo extends Model {
  public id!: number;
  public feeScheduleId!: number;
  public mapiissCode!: string;
  public paragraphType!: string;

  public feeSchedule?: Tarifario;
  public cups?: Cups;
}

TipoParagrafo.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID_TIPO_PARAGRAFO" },
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
    paragraphType: { type: DataTypes.STRING(100), allowNull: false, field: "TIPO_PARAGRAFO" },
  },
  {
    sequelize,
    tableName: "tipo_paragrafo",
    timestamps: false,
    indexes: [
      { fields: ["FK_TARIFARIO"] },
      { fields: ["FK_CODIGO_MAPIISS"] },
      { fields: ["TIPO_PARAGRAFO"] },
      { fields: ["FK_TARIFARIO", "FK_CODIGO_MAPIISS"] },
    ],
  }
);

export default TipoParagrafo;
