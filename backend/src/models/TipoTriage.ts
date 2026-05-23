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
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "pk_id_triage" },
    triageType: { type: DataTypes.INTEGER, allowNull: false, field: "tipo_triage" },
    classification: { type: DataTypes.STRING(100), allowNull: false, field: "clasificacion" },
    waitingTime: { type: DataTypes.STRING(50), allowNull: false, field: "tiempo_espera" },
  },
  {
    sequelize,
    tableName: "tipo_triage",
    timestamps: false,
  }
);

export default TipoTriage;