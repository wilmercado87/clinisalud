import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class ViaAcceso extends Model {
  public id!: number;
  public idViaAcceso!: number;
  public descripcionHonorario!: string;
  public porcentaje!: number;
}

ViaAcceso.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    idViaAcceso: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_VIA_ACCESO",
    },
    descripcionHonorario: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "DESCRIPCION_HONORARIO",
    },
    porcentaje: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "PORCENTAJE",
    },
  },
  {
    sequelize,
    tableName: "VIA_ACCESO",
    timestamps: false,
  }
);

export default ViaAcceso;