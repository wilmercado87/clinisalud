import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Tarifarios from "./Tarifarios";
import Cups from "./Cups";

class ParagrafoValor extends Model {
  public id!: number;
  public feeScheduleId!: number;
  public articleCode!: number;
  public mapiissCode!: string;
  public percentage!: number;
  public variationType!: string;
  public paragraphType!: string;

  public feeSchedule?: Tarifarios;
  public cups?: Cups;
}

ParagrafoValor.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "pk_id_paragrafo_valor" },
    feeScheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_id_tarifario"
    },
    articleCode: { type: DataTypes.INTEGER, allowNull: false, field: "cod_articulo" },
    mapiissCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "fk_codigo_mapiiss"
    },
    percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, field: "porcentaje" },
    variationType: { type: DataTypes.STRING(50), allowNull: false, field: "tipo_variacion" },
    paragraphType: { type: DataTypes.STRING(100), allowNull: false, field: "tipo_paragrafo" },
  },
  {
    sequelize,
    tableName: "paragrafo_valor",
    timestamps: false,
  }
);

export default ParagrafoValor;