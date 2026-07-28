import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Tarifario from "./Tarifario";

class TipoAcceso extends Model {
  public id!: number;
  public accessVia!: string;
  public feeScheduleId!: number;

  public feeSchedule?: Tarifario;
}

TipoAcceso.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID_TIPO_ACCESO" },
    accessVia: { type: DataTypes.STRING(100), allowNull: false, field: "VIA_ACCESO" },
    feeScheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_TARIFARIO"
    },
  },
  {
    sequelize,
    tableName: "tipo_acceso",
    timestamps: false,
  }
);

export default TipoAcceso;
