import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Triage extends Model {
  public id!: number;
  public tipoTriage!: string;
  public clasificacion!: string;
  public tiempoEspera!: string;
}

Triage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tipoTriage: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: "TIPO_TRIAGE",
    },
    clasificacion: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "CLASIFICACION",
    },
    tiempoEspera: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "TIEMPO_ESPERA",
    },
  },
  {
    sequelize,
    tableName: "TRIAGE",
    timestamps: false,
  }
);

export default Triage;