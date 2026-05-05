import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Prioridad extends Model {
  public id!: number;
  public prioridad!: number;
  public rangoDesde!: number;
  public rangoHasta!: number;
  public sexo!: string;
}

Prioridad.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    prioridad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "PRIORIDAD",
    },
    rangoDesde: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "RANGO_DESDE",
    },
    rangoHasta: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "RANGO_HASTA",
    },
    sexo: {
      type: DataTypes.STRING(1),
      allowNull: false,
      field: "SEXO",
    },
  },
  {
    sequelize,
    tableName: "PRIORIDAD",
    timestamps: false,
  }
);

export default Prioridad;