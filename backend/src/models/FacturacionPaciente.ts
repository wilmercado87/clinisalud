import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Paciente from "./Paciente";
import Contrato from "./Contrato";
import Diagnostico from "./Diagnostico";
import Cups from "./Cups";
import Cama from "./Cama";
import Especialidad from "./Especialidad";

class FacturacionPaciente extends Model {
  public id!: number;
  public numAdmision!: string;
  public idOrigenCta!: number;
  public idTarifario!: number;
  public idTipoServicio!: number;
  public idPaciente!: number;
  public idContrato!: string;
  public codDiagnostico!: string;
  public codProcedimiento!: string;
  public idCama!: number;
  public idEspecialidad!: number;
  public fechaAdmision!: string;
  public fechaEgreso!: string;
  public valorTotal!: number;
  public valorPaciente!: number;
  public valorCopago!: number;
  public estado!: string;

  public paciente?: Paciente;
  public contrato?: Contrato;
  public diagnostico?: Diagnostico;
  public procedimiento?: Cups;
  public cama?: Cama;
  public especialidad?: Especialidad;
}

FacturacionPaciente.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    numAdmision: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      field: "NUM_ADMISION",
    },
    idOrigenCta: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_ORIGENCTA",
    },
    idTarifario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_TARIFARIO",
    },
    idTipoServicio: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_TIPO_SERVICIO",
    },
    idPaciente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_PACIENTE",
    },
    idContrato: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "ID_CONTRATO",
    },
    codDiagnostico: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "COD_DIAGNOSTICO",
    },
    codProcedimiento: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "COD_PROCEDIMIENTO",
    },
    idCama: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "ID_CAMA",
    },
    idEspecialidad: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "ID_ESPECIALIDAD",
    },
    fechaAdmision: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "FECHA_ADMISION",
    },
    fechaEgreso: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "FECHA_EGRESO",
    },
    valorTotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "VALOR_TOTAL",
    },
    valorPaciente: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "VALOR_PACIENTE",
    },
    valorCopago: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "VALOR_COPAGO",
    },
    estado: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "PENDIENTE",
      field: "ESTADO",
    },
  },
  {
    sequelize,
    tableName: "FACTURACION_PACIENTE",
    timestamps: false,
  }
);

FacturacionPaciente.belongsTo(Paciente, { foreignKey: "ID_PACIENTE", as: "paciente" });
FacturacionPaciente.belongsTo(Contrato, { foreignKey: "ID_CONTRATO", as: "contrato", targetKey: "idEps" });
FacturacionPaciente.belongsTo(Diagnostico, { foreignKey: "COD_DIAGNOSTICO", as: "diagnostico", targetKey: "codigoDiagnostico" });
FacturacionPaciente.belongsTo(Cups, { foreignKey: "COD_PROCEDIMIENTO", as: "procedimiento", targetKey: "pkCodigoMapiiss" });
FacturacionPaciente.belongsTo(Cama, { foreignKey: "ID_CAMA", as: "cama", targetKey: "idHabitacion" });
FacturacionPaciente.belongsTo(Especialidad, { foreignKey: "ID_ESPECIALIDAD", as: "especialidad" });

export default FacturacionPaciente;