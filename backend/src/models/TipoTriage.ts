import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class TipoTriage extends Model {
  public id!: number;
  public triageType!: number;
  public classification!: string;
  public waitingTime!: string;
}

TipoTriage.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID_TIPO_TRIAGE" },
    triageType: { type: DataTypes.INTEGER, allowNull: false, field: "TIPO_TRIAGE" },
    classification: { type: DataTypes.STRING(100), allowNull: false, field: "CLASIFICACION" },
    waitingTime: { type: DataTypes.STRING(50), allowNull: false, field: "TIEMPO_ESPERA" },
  },
  {
    sequelize,
    tableName: "tipo_triage",
    timestamps: false,
  }
);

export default TipoTriage;
