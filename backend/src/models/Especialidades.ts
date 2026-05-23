import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Especialidades extends Model {
  public id!: number;
  public specialtyId!: string;
  public description!: string;
}

Especialidades.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "pk_id_especialidad" },
    specialtyId: { type: DataTypes.STRING(20), allowNull: false, field: "id_especialidad" },
    description: { type: DataTypes.STRING(150), allowNull: false, field: "descripcion_especialidad" },
  },
  {
    sequelize,
    tableName: "especialidades",
    timestamps: false,
  }
);

export default Especialidades;