import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Tarifario from "./Tarifario";
import Cups from "./Cups";

class Articulado extends Model {
  public id!: number;
  public feeScheduleId!: number;
  public articleCode!: number;
  public paragraph!: string;
  public mapiissCode!: string;
  public description!: string | null;
  public paragraphType!: string;

  public feeSchedule?: Tarifario;
  public cups?: Cups;
}

Articulado.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID" },
    feeScheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_TARIFARIO"
    },
    articleCode: { type: DataTypes.INTEGER, allowNull: false, field: "COD_ARTICULO" },
    paragraph: { type: DataTypes.STRING(50), allowNull: false, field: "PARAGRAFO" },
    mapiissCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "FK_CODIGO_MAPIISS"
    },
    description: { type: DataTypes.TEXT, field: "DESCRIPCION" },
    paragraphType: { type: DataTypes.STRING(100), allowNull: false, field: "TIPO_PARAGRAFO" },
  },
  {
    sequelize,
    tableName: "articulado",
    timestamps: false,
    indexes: [
      { fields: ["FK_TARIFARIO"] },
      { fields: ["FK_CODIGO_MAPIISS"] },
      { fields: ["COD_ARTICULO"] },
      { fields: ["FK_TARIFARIO", "COD_ARTICULO"] },
    ],
  }
);

export default Articulado;
