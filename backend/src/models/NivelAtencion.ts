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
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "pk_id_nivel_atencion" },
    complexity: { type: DataTypes.STRING(50), allowNull: false, field: "complejidad" },
    description: { type: DataTypes.STRING(150), allowNull: false, field: "descripcion" },
    personalType: { type: DataTypes.TEXT, allowNull: false, field: "tipo_personal" },
  },
  {
    sequelize,
    tableName: "nivel_atencion",
    timestamps: false,
  }
);

export default NivelAtencion;