import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class DiagnosticoAplicacion extends Model {
  public id!: number;
  public idDiagnostico!: number;
  public codigo!: string;
  public descripcion!: string;
  public idTipoOrigen!: number;
  public aplicaSexo!: string;
}

DiagnosticoAplicacion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    idDiagnostico: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_DIAGNOSTICO",
    },
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "CODIGO",
    },
    descripcion: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: "DESCRIPCION",
    },
    idTipoOrigen: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_TIPO_ORIGEN",
    },
    aplicaSexo: {
      type: DataTypes.STRING(5),
      allowNull: false,
      field: "APLICA_SEXO",
    },
  },
  {
    sequelize,
    tableName: "DIAGNOSTICO_APLICACION",
    timestamps: false,
  }
);

export default DiagnosticoAplicacion;