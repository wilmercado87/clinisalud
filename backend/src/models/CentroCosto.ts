import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import NivelAtencion from "./NivelAtencion";
import Especialidades from "./Especialidades";

class CentroCosto extends Model {
  public id!: number;
  public description!: string;
  public levelId!: number;
  public scopeType!: string;
  public specialtyId!: number | null;

  public level?: NivelAtencion;
  public especialidad?: Especialidades;
}

CentroCosto.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "pk_id_centro_costo" },
    description: { type: DataTypes.STRING(150), allowNull: false, field: "descripcion_centro_costo" },
    levelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "pk_id_nivel_atencion"
    },
    specialtyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "fk_id_especialidad"
    },
    scopeType: { type: DataTypes.STRING(50), allowNull: false, field: "tipo_ambito" },
  },
  {
    sequelize,
    tableName: "centro_costo",
    timestamps: false,
  }
);

export default CentroCosto;