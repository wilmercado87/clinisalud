import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Rol extends Model {
  public id!: number;
  public name!: string;
  public code!: string;
}

Rol.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "ID",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "NOMBRE",
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: "CODIGO",
    },
  },
  {
    sequelize,
    tableName: "rol",
    timestamps: false,
  },
);

export default Rol;
