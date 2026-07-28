import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class TipoUsuario extends Model {
  public id!: number;
  public name!: string;
  public copay!: number;
  public moderatorFee!: number;
  public eventLimit!: number;
  public annualEventLimit!: number;
}

TipoUsuario.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID_TIPO_USUARIO" },
    name: { type: DataTypes.STRING(50), allowNull: false, field: "TIPO_USUARIO" },
    copay: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0, field: "COPAGO" },
    moderatorFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0, field: "CUOTA_MODERADORA" },
    eventLimit: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.0, field: "TOPE_EVENTO" },
    annualEventLimit: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.0, field: "TOPE_EVENTO_ANUAL" },
  },
  {
    sequelize,
    tableName: "tipo_usuario",
    timestamps: false,
  }
);

export default TipoUsuario;
