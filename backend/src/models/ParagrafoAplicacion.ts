import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Tarifarios from "./Tarifarios";
import Cups from "./Cups";
import Diagnostico from "./Diagnostico";

class ParagrafoAplicacion extends Model {
  public id!: number;
  public feeScheduleId!: number;
  public mapiissCode!: string;
  public diagnosticCode!: string;

  // 🔄 Propiedades virtuales sincronizadas con los alias exactos de associations.ts
  public feeSchedule?: Tarifarios;
  public cups?: Cups;
  public diagnostic?: Diagnostico;
}

ParagrafoAplicacion.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "pk_id_paragrafo_aplicacion" },
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
    diagnosticCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "fk_codigo_diagnostico"
    },
  },
  {
    sequelize,
    tableName: "paragrafo_aplicacion",
    timestamps: false,
  }
);

export default ParagrafoAplicacion;