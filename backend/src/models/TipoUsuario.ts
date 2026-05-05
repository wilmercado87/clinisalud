import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class TipoUsuario extends Model {
  public id!: number;
  public tipoUsuario!: string;
  public copago!: string;
  public cuotaModeradora!: string;
  public topeEvento!: string;
  public topeAno!: string;
}

TipoUsuario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tipoUsuario: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "TIPO_USUARIO",
    },
    copago: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "COPAGO",
    },
    cuotaModeradora: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "CUOTA_MODERADORA",
    },
    topeEvento: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "TOPE_EVENTO",
    },
    topeAno: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "TOPE_ANO",
    },
  },
  {
    sequelize,
    tableName: "TIPO_USUARIO",
    timestamps: false,
  }
);

export default TipoUsuario;