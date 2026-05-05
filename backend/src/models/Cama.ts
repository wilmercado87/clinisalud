import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Cama extends Model {
  public idHabitacion!: number;
  public codigo!: string;
  public estado!: number;
  public estadoPaciente!: string;
}

Cama.init(
  {
    idHabitacion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      field: "ID_HABITACION",
    },
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "CODIGO",
    },
    estado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ESTADO",
    },
    estadoPaciente: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "ESTADO_PACIENTE",
    },
  },
  {
    sequelize,
    tableName: "CAMA",
    timestamps: false,
  }
);

export default Cama;