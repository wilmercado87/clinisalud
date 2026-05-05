import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Diagnostico extends Model {
  public id!: number;
  public codigoDiagnostico!: string;
  public descripcion!: string;
}

Diagnostico.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    codigoDiagnostico: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      field: "CODIGO_DIAGNOSTICO",
    },
    descripcion: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: "DESCRIPCION",
    },
  },
  {
    sequelize,
    tableName: "DIAGNOSTICO",
    timestamps: false,
  }
);

export default Diagnostico;