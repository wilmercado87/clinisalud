import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Estancia extends Model {
  public codigo!: string;
  public descripcion!: string;
}

Estancia.init(
  {
    codigo: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      field: "CODIGO",
    },
    descripcion: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: "DESCRIPCION",
    },
  },
  {
    sequelize,
    tableName: "ESTANCIA",
    timestamps: false,
  }
);

export default Estancia;