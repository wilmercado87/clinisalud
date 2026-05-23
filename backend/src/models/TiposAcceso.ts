import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Tarifarios from "./Tarifarios";

class TiposAcceso extends Model {
  public id!: number;
  public accessVia!: string;
  public feeScheduleId!: number;

  public feeSchedule?: Tarifarios;
}

TiposAcceso.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "pk_id_tipo_acceso" },
    accessVia: { type: DataTypes.STRING(100), allowNull: false, field: "via_acceso" },
    feeScheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_id_tarifario"
    },
  },
  {
    sequelize,
    tableName: "tipos_de_acceso",
    timestamps: false,
  }
);

export default TiposAcceso;