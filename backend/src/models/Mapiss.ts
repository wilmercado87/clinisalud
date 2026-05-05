import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Mapiss extends Model {
  public codIss2001!: string;
  public descripcion!: string;
}

Mapiss.init(
  {
    codIss2001: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      field: "COD_ISS2001",
    },
    descripcion: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: "DESCRIPCION",
    },
  },
  {
    sequelize,
    tableName: "MAPISS",
    timestamps: false,
  }
);

export default Mapiss;