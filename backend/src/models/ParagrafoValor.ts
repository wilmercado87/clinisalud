import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Tarifario from "./Tarifario";
import Cups from "./Cups";

class ParagrafoValor extends Model {
  public id!: number;
  public feeScheduleId!: number;
  public articleCode!: number;
  public mapiissCode!: string;
  public percentage!: number;
  public variationType!: string;
  public paragraphType!: string;

  public feeSchedule?: Tarifario;
  public cups?: Cups;
}

ParagrafoValor.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID_PARAGRAFO_VALOR" },
    feeScheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_TARIFARIO"
    },
    articleCode: { type: DataTypes.INTEGER, allowNull: false, field: "COD_ARTICULO" },
    mapiissCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "FK_CODIGO_MAPIISS"
    },
    percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, field: "PORCENTAJE" },
    variationType: { type: DataTypes.STRING(50), allowNull: false, field: "TIPO_VARIACION" },
    paragraphType: { type: DataTypes.STRING(100), allowNull: false, field: "TIPO_PARAGRAFO" },
  },
  {
    sequelize,
    tableName: "paragrafo_valor",
    timestamps: false,
    indexes: [
      { fields: ["FK_TARIFARIO"] },
      { fields: ["FK_CODIGO_MAPIISS"] },
      { fields: ["COD_ARTICULO"] },
      { fields: ["FK_TARIFARIO", "FK_CODIGO_MAPIISS"] },
    ],
  }
);

export default ParagrafoValor;
