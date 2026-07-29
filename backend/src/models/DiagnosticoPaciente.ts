import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Admision from "./Admision";
import Diagnostico from "./Diagnostico";

class DiagnosticoPaciente extends Model {
  public id!: number;
  public admissionNumber!: string;
  public diagnosticId!: number;

  public admission?: Admision;
  public diagnostic?: Diagnostico;
}

DiagnosticoPaciente.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID_DIAG_PACIENTE" },
    admissionNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "FK_ADMISION"
    },
    diagnosticId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_DIAGNOSTICO"
    },
  },
  {
    sequelize,
    tableName: "diagnostico_paciente",
    timestamps: false,
    indexes: [
      { fields: ["FK_ADMISION"] },
      { fields: ["FK_DIAGNOSTICO"] },
      { fields: ["FK_ADMISION", "FK_DIAGNOSTICO"] },
    ],
  }
);

export default DiagnosticoPaciente;
