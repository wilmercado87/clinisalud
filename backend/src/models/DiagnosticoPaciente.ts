import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Admisiones from "./Admisiones";
import Diagnostico from "./Diagnostico";

class DiagnosticoPaciente extends Model {
  public id!: number;
  public admissionNumber!: string;
  public documentType!: string | null;
  public diagnosticId!: number;

  public admissionData?: Admisiones;
  public diagnosticData?: Diagnostico;
}

DiagnosticoPaciente.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "pk_diag_paciente" },
    admissionNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "fk_numero_admision",
      references: { model: "admisiones", key: "admissionNumber" },
    },
documentType: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: "pk_tipo_documento",
      },
    diagnosticId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_id_diagnostico",
      references: { model: "diagnostico", key: "id" },
    },
  },
  {
    sequelize,
    tableName: "diagnostico_paciente",
    timestamps: false,
  }
);

export default DiagnosticoPaciente;