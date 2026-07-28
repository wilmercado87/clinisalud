import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class NivelAtencion extends Model {
  public id!: number;
  public complexity!: string;
  public description!: string;
  public personalType!: string;
}

NivelAtencion.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID_NIVEL_ATENCION" },
    complexity: { type: DataTypes.STRING(50), allowNull: false, field: "COMPLEJIDAD" },
    description: { type: DataTypes.STRING(150), allowNull: false, field: "DESCRIPCION" },
    personalType: { type: DataTypes.TEXT, allowNull: false, field: "TIPO_PERSONAL" },
  },
  {
    sequelize,
    tableName: "nivel_atencion",
    timestamps: false,
  }
);

export default NivelAtencion;
