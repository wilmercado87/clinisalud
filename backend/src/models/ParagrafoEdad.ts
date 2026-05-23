import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Tarifarios from "./Tarifarios";
import Cups from "./Cups";

class ParagrafoEdad extends Model {
  public id!: number;
  public feeScheduleId!: number;
  public mapiissCode!: string;
  public rangeFrom!: number;
  public rangeTo!: number;

  public feeSchedule?: Tarifarios;
  public cups?: Cups;
}

ParagrafoEdad.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "pk_id_paragrafo_edad" },
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
    rangeFrom: { type: DataTypes.INTEGER, defaultValue: 0, field: "rango_desde" },
    rangeTo: { type: DataTypes.INTEGER, defaultValue: 150, field: "rango_hasta" },
  },
  {
    sequelize,
    tableName: "paragrafo_edad",
    timestamps: false,
  }
);

export default ParagrafoEdad;