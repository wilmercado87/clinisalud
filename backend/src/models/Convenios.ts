import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Tarifarios from "./Tarifarios";

class Convenios extends Model {
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

  public feeSchedule?: Tarifarios;
}

Convenios.init(
  {
    idEps: { type: DataTypes.BIGINT, primaryKey : true, allowNull: false, field: "id_eps" },
    epsCode: { type: DataTypes.STRING(30), allowNull: false, field: "cod_eps" },
    epsName: { type: DataTypes.STRING(150), allowNull: false, field: "nombre_eps" },
    address: { type: DataTypes.STRING(255), field: "direccion" },
    phone: { type: DataTypes.STRING(50), field: "telefono" },
    feeScheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_id_tarifario"
    },
    variationType: { type: DataTypes.STRING(20), allowNull: false, field: "tipo_variacion" },
    contractPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, field: "porcentaje_contrato" },
    startDate: { type: DataTypes.STRING(30), field: "fecha_ini_contrato" },
    endDate: { type: DataTypes.STRING(30), field: "fecha_fin_contrato" },
  },
  {
    sequelize,
    tableName: "convenios",
    timestamps: false,
  }
);

export default Convenios;