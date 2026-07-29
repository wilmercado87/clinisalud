import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Convenio from "./Convenio";
import Tarifario from "./Tarifario";

class Contrato extends Model {
  public id!: number;
  public epsId!: number;
  public feeScheduleId!: number;
  public variationType!: string;
  public ambulatoryPercentage!: number;
  public urgencyPercentage!: number;
  public hospitalizationPercentage!: number;
  public contractNumber!: string;
  public startDate!: string;
  public endDate!: string;

  public eps?: Convenio;
  public feeSchedule?: Tarifario;
}

Contrato.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID_CONTRATO" },
    epsId: { type: DataTypes.BIGINT, allowNull: false, field: "FK_EPS" },
    feeScheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_TARIFARIO"
    },
    variationType: { type: DataTypes.STRING(20), allowNull: false, field: "TIPO_VARIACION" },
    ambulatoryPercentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0.0, field: "PORCENTAJE_AMB" },
    urgencyPercentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0.0, field: "PORCENTAJE_URG" },
    hospitalizationPercentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0.0, field: "PORCENTAJE_HOSP" },
    contractNumber: { type: DataTypes.STRING(50), allowNull: false, field: "CONTRATO" },
    startDate: { type: DataTypes.STRING(30), allowNull: false, field: "FECHA_INI_CONTRATO" },
    endDate: { type: DataTypes.STRING(30), allowNull: false, field: "FECHA_FIN_CONTRATO" },
  },
  {
    sequelize,
    tableName: "contrato",
    timestamps: false,
  }
);

export default Contrato;
