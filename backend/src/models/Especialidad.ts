import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Especialidad extends Model {
  public id!: number;
  public specialtyId!: string;
  public description!: string;
}

Especialidad.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID_ESPECIALIDAD" },
    specialtyId: { type: DataTypes.STRING(20), allowNull: false, field: "ID_CODIGO_ESPECIALIDAD" },
    description: { type: DataTypes.STRING(150), allowNull: false, field: "DESCRIPCION_ESPECIALIDAD" },
  },
  {
    sequelize,
    tableName: "especialidad",
    timestamps: false,
  }
);

export default Especialidad;
