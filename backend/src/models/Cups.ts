import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Cups extends Model {
  public pkCodigoMapiiss!: string;
  public descripcionMapiiss!: string;
  public uvr!: number;
  public vrCirujano!: number;
  public vrAnestesiologo!: number;
  public vrAyudante!: number;
  public vrSala!: number;
  public vrMateriales!: number;
  public vrNeto!: number;
  public tipoEvento!: string;
  public idCentroCosto!: number;
  public idTarifario!: number;
  public aplicaSexo!: string;
  public descripEvento!: string;
  public autAmb!: string;
  public autHosp!: string;
  public cantidadMaxima!: number;
  public nivelAtencion!: number;
  public tipoRips!: string;
}

Cups.init(
  {
    pkCodigoMapiiss: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      field: "PK_CODIGO_MAPIISS",
    },
    descripcionMapiiss: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: "DESCRIPCION_MAPIISS",
    },
    uvr: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "UVR",
    },
    vrCirujano: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "VR_CIRUJANO",
    },
    vrAnestesiologo: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "VR_ANESTESIOLOGO",
    },
    vrAyudante: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "VR_AYUDANTE",
    },
    vrSala: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "VR_SALA",
    },
    vrMateriales: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "VR_MATERIALES",
    },
    vrNeto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "VR_NETO",
    },
    tipoEvento: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: "TIPO_EVENTO",
    },
    idCentroCosto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_CENTRO_COSTO",
    },
    idTarifario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_TARIFARIO",
    },
    aplicaSexo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: "APLICA_SEXO",
    },
    descripEvento: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "DESCRIP_EVENTO",
    },
    autAmb: {
      type: DataTypes.STRING(5),
      allowNull: false,
      field: "AUT_AMB",
    },
    autHosp: {
      type: DataTypes.STRING(5),
      allowNull: false,
      field: "AUT_HOSP",
    },
    cantidadMaxima: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "CANT_MAXIMA",
    },
    nivelAtencion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "NIVEL_ATENCION",
    },
    tipoRips: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: "TIPO_RIPS",
    },
  },
  {
    sequelize,
    tableName: "CUPS",
    timestamps: false,
    indexes: [
      {
        fields: ["pkCodigoMapiiss"],
      },
    ],
  }
);

export default Cups;