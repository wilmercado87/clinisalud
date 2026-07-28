import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import NivelAtencion from "./NivelAtencion";
import Especialidad from "./Especialidad";

class CentroCosto extends Model {
  public id!: number;
  public description!: string;
  public levelId!: number;
  public scopeType!: string;
  public specialtyId!: number | null;

  public level?: NivelAtencion;
  public especialidad?: Especialidad;
}

CentroCosto.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID_CENTRO_COSTO" },
    description: { type: DataTypes.STRING(150), allowNull: false, field: "DESCRIPCION_CENTRO_COSTO" },
    levelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_NIVEL_ATENCION"
    },
    specialtyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "FK_ESPECIALIDAD"
    },
    scopeType: { type: DataTypes.STRING(50), allowNull: false, field: "TIPO_AMBITO" },
  },
  {
    sequelize,
    tableName: "centro_costo",
    timestamps: false,
  }
);

export default CentroCosto;
