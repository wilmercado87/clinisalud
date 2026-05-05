import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class CentroCosto extends Model {
  public id!: number;
  public idCentroCosto!: number;
  public descripcionCentroCosto!: string;
  public idNivelComplejidad!: number;
  public tipoAmbito!: string;
}

CentroCosto.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    idCentroCosto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: "ID_CENTRO_COSTO",
    },
    descripcionCentroCosto: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: "DESCRIPCION_CENTRO_COSTO",
    },
    idNivelComplejidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_NIVEL_COMPLEJIDAD",
    },
    tipoAmbito: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "TIPO_AMBITO",
    },
  },
  {
    sequelize,
    tableName: "CENTRO_COSTO",
    timestamps: false,
  }
);

export default CentroCosto;