import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Cama extends Model {
  public id!: number;
  public roomId!: number;
  public bedCode!: string;
  public bedStatus!: number;
  public patientStatus!: string;
}

Cama.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID" },
    roomId: { type: DataTypes.INTEGER, allowNull: false, field: "ID_HABITACION" },
    bedCode: { type: DataTypes.STRING(20), allowNull: false, field: "CODIGO_CAMA" },
    bedStatus: { type: DataTypes.INTEGER, defaultValue: 0, field: "ESTADO_CAMA" },
    patientStatus: { type: DataTypes.STRING(50), allowNull: false, field: "ESTADO_PACIENTE" },
  },
  {
    sequelize,
    tableName: "cama",
    timestamps: false,
  }
);

export default Cama;
