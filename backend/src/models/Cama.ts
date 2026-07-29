import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Cama extends Model {
  public roomId!: number;
  public bedCode!: string;
  public bedStatus!: number;
  public tipoCama!: string;
}

Cama.init(
  {
    roomId: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, field: "ID_HABITACION" },
    bedCode: { type: DataTypes.STRING(20), allowNull: false, field: "CODIGO_CAMA" },
    bedStatus: { type: DataTypes.INTEGER, defaultValue: 0, field: "ESTADO_CAMA" },
    tipoCama: { type: DataTypes.STRING(50), allowNull: false, field: "TIPO_CAMA" },
  },
  {
    sequelize,
    tableName: "cama",
    timestamps: false,
    indexes: [
      { fields: ["CODIGO_CAMA"] },
      { fields: ["ESTADO_CAMA"] },
      { fields: ["TIPO_CAMA"] },
    ],
  }
);

export default Cama;
