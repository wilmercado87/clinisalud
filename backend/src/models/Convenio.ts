import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Tarifario from "./Tarifario";

class Convenio extends Model {
  public idEps!: number;
  public epsCode!: string;
  public epsName!: string;
  public address!: string | null;
  public phone!: string | null;
  public feeScheduleId!: number;
  public variationType!: string;
  public contractPercentage!: number;
  public startDate!: string | null;
  public endDate!: string | null;

  public feeSchedule?: Tarifario;
}

Convenio.init(
  {
    idEps: { type: DataTypes.BIGINT, primaryKey : true, allowNull: false, field: "ID_EPS" },
    epsCode: { type: DataTypes.STRING(30), allowNull: false, field: "COD_EPS" },
    epsName: { type: DataTypes.STRING(150), allowNull: false, field: "NOMBRE_EPS" },
    address: { type: DataTypes.STRING(255), field: "DIRECCION" },
    phone: { type: DataTypes.STRING(50), field: "TELEFONO" },
    feeScheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_TARIFARIO"
    },
    variationType: { type: DataTypes.STRING(20), allowNull: false, field: "TIPO_VARIACION" },
    contractPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, field: "PORCENTAJE_CONTRATO" },
    startDate: { type: DataTypes.STRING(30), field: "FECHA_INI_CONTRATO" },
    endDate: { type: DataTypes.STRING(30), field: "FECHA_FIN_CONTRATO" },
  },
  {
    sequelize,
    tableName: "convenio",
    timestamps: false,
  }
);

export default Convenio;
