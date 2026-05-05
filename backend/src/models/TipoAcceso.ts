import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class TipoAcceso extends Model {
  public id!: number;
  public viaAcceso!: string;
  public idTarifario!: number;
}

TipoAcceso.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    viaAcceso: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "VIA_ACCESO",
    },
    idTarifario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_TARIFARIO",
    },
  },
  {
    sequelize,
    tableName: "TIPO_ACCESO",
    timestamps: false,
  }
);

export default TipoAcceso;