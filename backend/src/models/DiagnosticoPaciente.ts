import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class DiagnosticoPaciente extends Model {
  public id!: number;
  public codigo!: string;
  public identificacion!: string;
  public numeroAdmision!: string;
  public tipoDiagnostico!: string;
}

DiagnosticoPaciente.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "CODIGO",
    },
    identificacion: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "IDENTIFICACION",
    },
    numeroAdmision: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "NUMERO_ADMISION",
    },
    tipoDiagnostico: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "TIPO_DIAGNOSTICO",
    },
  },
  {
    sequelize,
    tableName: "DIAGNOSTICO_PACIENTE",
    timestamps: false,
  }
);

export default DiagnosticoPaciente;