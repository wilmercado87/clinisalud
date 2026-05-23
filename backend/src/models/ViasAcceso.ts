import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import TiposAcceso from "./TiposAcceso";

class ViasAcceso extends Model {
  public id!: number;
  public accessViaId!: number;
  public honoraryDescription!: string;
  public percentage!: number;

  public accessViaData?: TiposAcceso;
}

ViasAcceso.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    accessViaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id_via_acceso",
      references: { model: "tipos_de_acceso", key: "id" },
    },
    honoraryDescription: { type: DataTypes.STRING(100), allowNull: false, field: "descripcion_honorario" },
    percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, field: "porcentaje" },
  },
  {
    sequelize,
    tableName: "vias_acceso",
    timestamps: false,
  }
);

export default ViasAcceso;