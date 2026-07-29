import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Convenio extends Model {
  public idEps!: number;
  public epsCode!: string;
  public epsName!: string;
  public address!: string | null;
  public phone!: string | null;
}

Convenio.init(
  {
    idEps: { type: DataTypes.BIGINT, primaryKey : true, allowNull: false, field: "ID_EPS" },
    epsCode: { type: DataTypes.STRING(30), allowNull: false, field: "COD_EPS" },
    epsName: { type: DataTypes.STRING(150), allowNull: false, field: "NOMBRE_EPS" },
    address: { type: DataTypes.STRING(255), field: "DIRECCION" },
    phone: { type: DataTypes.STRING(50), field: "TELEFONO" },
  },
  {
    sequelize,
    tableName: "convenio",
    timestamps: false,
  }
);

export default Convenio;
