import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import TipoAcceso from "./TipoAcceso";

class ViaAcceso extends Model {
  public id!: number;
  public accessViaId!: number;
  public honoraryDescription!: string;
  public percentage!: number;

  public accessVia?: TipoAcceso;
}

ViaAcceso.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID" },
    accessViaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_TIPO_ACCESO",
    },
    honoraryDescription: { type: DataTypes.STRING(100), allowNull: false, field: "DESCRIPCION_HONORARIO" },
    percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, field: "PORCENTAJE" },
  },
  {
    sequelize,
    tableName: "via_acceso",
    timestamps: false,
    indexes: [
      { fields: ["FK_TIPO_ACCESO"] },
    ],
  }
);

export default ViaAcceso;
