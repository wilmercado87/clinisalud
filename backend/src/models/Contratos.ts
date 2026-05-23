import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Tarifarios from "./Tarifarios";

class Contratos extends Model {
  public epsId!: number;
  public name!: string;
  public feeScheduleId!: number;
  public variationType!: string;
  public ambulatoryPercentage!: number;
  public urgencyPercentage!: number;
  public hospitalizationPercentage!: number;
  public contractNumber!: string;
  public startDate!: string;
  public endDate!: string;

  public feeScheduleData?: Tarifarios;
}

Contratos.init(
  {
    epsId: { type: DataTypes.BIGINT, primaryKey: true, field: "id_eps" },
    name: { type: DataTypes.STRING(150), allowNull: false, field: "nombre" },
    feeScheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id_tarifario",
      references: { model: "tarifarios", key: "id" },
    },
    variationType: { type: DataTypes.STRING(20), allowNull: false, field: "tipo_variacion" },
    ambulatoryPercentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0.0, field: "porcentaje_amb" },
    urgencyPercentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0.0, field: "porcentaje_urg" },
    hospitalizationPercentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0.0, field: "porcentaje_hosp" },
    contractNumber: { type: DataTypes.STRING(50), allowNull: false, field: "contrato" },
    startDate: { type: DataTypes.STRING(30), allowNull: false, field: "fecha_ini_contrato" },
    endDate: { type: DataTypes.STRING(30), allowNull: false, field: "fecha_fin_contrato" },
  },
  {
    sequelize,
    tableName: "contratos",
    timestamps: false,
  }
);

export default Contratos;