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
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "pk_id_tipo_usuario" },
    name: { type: DataTypes.STRING(50), allowNull: false, field: "tipo_usuario" },
    copay: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0, field: "copago" },
    moderatorFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0, field: "cuota_moderadora" },
    eventLimit: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.0, field: "tope_evento" },
    annualEventLimit: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.0, field: "tope_evento_anual" },
  },
  {
    sequelize,
    tableName: "tipo_usuario",
    timestamps: false,
  }
);

export default TipoUsuario;