import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class TipoDocumento extends Model {
  public id!: number;
  public codigo!: string;
  public descripcion!: string;
}

TipoDocumento.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      field: "CODIGO",
    },
    descripcion: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "DESCRIPCION",
    },
  },
  {
    sequelize,
    tableName: "TIPO_DOCUMENTO",
    timestamps: false,
  }
);

export default TipoDocumento;