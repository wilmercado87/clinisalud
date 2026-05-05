import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Departamento from "./Departamento";
import Municipio from "./Municipio";
import TipoUsuario from "./TipoUsuario";
import TipoDocumento from "./TipoDocumento";
import Convenio from "./Convenio";

class Paciente extends Model {
  public id!: number;
  public idPaciente!: number;
  public idTipoDocumento!: number;
  public numDocumento!: string;
  public primerNombre!: string;
  public segundoNombre!: string;
  public primerApellido!: string;
  public segundoApellido!: string;
  public fechaNacimiento!: string;
  public genero!: string;
  public direccion!: string;
  public telefono!: string;
  public idMunicipio!: number;
  public idDepartamento!: number;
  public idTipoUsuario!: number;
  public idConvenio!: string;

  public departamento?: Departamento;
  public municipio?: Municipio;
  public tipoUsuario?: TipoUsuario;
  public tipoDocumento?: TipoDocumento;
  public contrato?:Convenio;
}

Paciente.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    idPaciente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: "ID_PACIENTE",
    },
    idTipoDocumento: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_TIPO_DOCUMENTO",
    },
    numDocumento: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: "NUM_DOCUMENTO",
    },
    primerNombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "PRIMER_NOMBRE",
    },
    segundoNombre: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "SEGUNDO_NOMBRE",
    },
    primerApellido: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "PRIMER_APELLIDO",
    },
    segundoApellido: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "SEGUNDO_APELLIDO",
    },
    fechaNacimiento: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "FECHA_NACIMIENTO",
    },
    genero: {
      type: DataTypes.STRING(5),
      allowNull: false,
      field: "GENERO",
    },
    direccion: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "DIRECCION",
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "TELEFONO",
    },
    idMunicipio: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_MUNICIPIO",
    },
    idDepartamento: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_DEPARTAMENTO",
    },
    idTipoUsuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_TIPO_USUARIO",
    },
    idConvenio: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "ID_CONVENIO",
    },
  },
  {
    sequelize,
    tableName: "PACIENTE",
    timestamps: false,
    indexes: [{ fields: ["numDocumento"] }],
  }
);

Paciente.belongsTo(Departamento, { foreignKey: "ID_DEPARTAMENTO", as: "departamento" });
Paciente.belongsTo(Municipio, { foreignKey: "ID_MUNICIPIO", as: "municipio" });
Paciente.belongsTo(TipoUsuario, { foreignKey: "ID_TIPO_USUARIO", as: "tipoUsuario" });
Paciente.belongsTo(TipoDocumento, { foreignKey: "ID_TIPO_DOCUMENTO", as: "tipoDocumento" });
Paciente.belongsTo(Convenio, { foreignKey: "ID_CONVENIO", as: "contrato" });

export default Paciente;