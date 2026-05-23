import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Departamentos extends Model {
  public dptoId!: string;
  public id!: number;
  public department!: string;
  public ripsDptoCode!: number;
}

Departamentos.init(
  {
    dptoId: {
      type: DataTypes.STRING(30),
      primaryKey: true,
      field: "id_dpto",
    },
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      unique: true,
      allowNull: false,
      field: "id",
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "departamento",
    },
    ripsDptoCode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "cod_dpto_rips",
    },
  },
  {
    sequelize,
    tableName: "departamentos",
    timestamps: false,
  },
);

export default Departamentos;