import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Camas extends Model {
  public roomId!: number;
  public bedCode!: string;
  public bedStatus!: number;
  public patientStatus!: string;
}

Camas.init(
  {
    roomId: { type: DataTypes.INTEGER, primaryKey: true, field: "pk_id_habitacion" },
    bedCode: { type: DataTypes.STRING(20), primaryKey: true, field: "codigo_cama" },
    bedStatus: { type: DataTypes.INTEGER, defaultValue: 0, field: "estado_cama" },
    patientStatus: { type: DataTypes.STRING(50), allowNull: false, field: "estado_paciente" },
  },
  {
    sequelize,
    tableName: "camas",
    timestamps: false,
  }
);

export default Camas;