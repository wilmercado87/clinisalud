import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Tarifario from "./Tarifario";
import Cups from "./Cups";

class ParagrafoEdad extends Model {
  public id!: number;
  public feeScheduleId!: number;
  public mapiissCode!: string;
  public rangeFrom!: number;
  public rangeTo!: number;

  public feeSchedule?: Tarifario;
  public cups?: Cups;
}

ParagrafoEdad.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID_PARAGRAFO_EDAD" },
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
    rangeFrom: { type: DataTypes.INTEGER, defaultValue: 0, field: "RANGO_DESDE" },
    rangeTo: { type: DataTypes.INTEGER, defaultValue: 150, field: "RANGO_HASTA" },
  },
  {
    sequelize,
    tableName: "paragrafo_edad",
    timestamps: false,
  }
);

export default ParagrafoEdad;
