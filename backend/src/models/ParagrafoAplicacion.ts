import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Tarifario from "./Tarifario";
import Cups from "./Cups";
import Diagnostico from "./Diagnostico";

class ParagrafoAplicacion extends Model {
  public id!: number;
  public feeScheduleId!: number;
  public mapiissCode!: string;
  public diagnosticId!: number;

  public feeSchedule?: Tarifario;
  public cups?: Cups;
  public diagnostic?: Diagnostico;
}

ParagrafoAplicacion.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID_PARAGRAFO_APLICACION" },
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
    diagnosticId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_DIAGNOSTICO"
    },
  },
  {
    sequelize,
    tableName: "paragrafo_aplicacion",
    timestamps: false,
  }
);

export default ParagrafoAplicacion;
