import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Admisiones from "./Admisiones";
import Diagnostico from "./Diagnostico";

class DiagnosticoPaciente extends Model {
  public id!: number;
  public admissionNumber!: string;
  public diagnosticId!: number;

  public admission?: Admisiones;
  public diagnostic?: Diagnostico;
}

DiagnosticoPaciente.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "pk_diag_paciente" },
    admissionNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "fk_numero_admision"
    },
    diagnosticId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_id_diagnostico"
    },
  },
  {
    sequelize,
    tableName: "diagnostico_paciente",
    timestamps: false,
  }
);

export default DiagnosticoPaciente;