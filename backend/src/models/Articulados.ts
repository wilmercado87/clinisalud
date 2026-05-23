import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Tarifarios from "./Tarifarios";
import Cups from "./Cups";

class Articulados extends Model {
  public id!: number;
  public feeScheduleId!: number;
  public articleCode!: number;
  public paragraph!: string;
  public mapiissCode!: string;
  public description!: string | null;
  public paragraphType!: string;

  public feeSchedule?: Tarifarios;
  public cups?: Cups;
}

Articulados.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    feeScheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_id_tarifario"
    },
    articleCode: { type: DataTypes.INTEGER, allowNull: false, field: "cod_articulo" },
    paragraph: { type: DataTypes.STRING(50), allowNull: false, field: "paragrafo" },
    mapiissCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "codigo_cups"
    },
    description: { type: DataTypes.TEXT, field: "descripcion" },
    paragraphType: { type: DataTypes.STRING(100), allowNull: false, field: "tipo_paragrafo" },
  },
  {
    sequelize,
    tableName: "articulados",
    timestamps: false,
  }
);

export default Articulados;