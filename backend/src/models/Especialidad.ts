import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Especialidad extends Model {
  public id!: number;
  public idEspec!: string;
  public especilidad!: string;
}

Especialidad.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    idEspec: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "ID_ESPEC",
    },
    especilidad: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "ESPECILIDAD",
    },
  },
  {
    sequelize,
    tableName: "ESPECIALIDAD",
    timestamps: false,
  }
);

export default Especialidad;