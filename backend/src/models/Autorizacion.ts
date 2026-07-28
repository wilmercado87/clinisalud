import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Admision from "./Admision";
import TipoAutorizacion from "./TipoAutorizacion";
import Cups from "./Cups";
import Usuario from "./Usuario";

class Autorizacion extends Model {
  public id!: number;
  public admissionNumber!: string;
  public authTypeId!: number;
  public authNumber!: string;
  public mapiissCode!: string;
  public quantity!: number;
  public systemUserId!: number;

  public admission?: Admision;
  public authType?: TipoAutorizacion;
  public cups?: Cups;
  public systemUser?: Usuario;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Autorizacion.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: "ID" },
    admissionNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "FK_ADMISION"
    },
    authTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_TIPO_AUTORIZACION",
    },
    authNumber: { type: DataTypes.STRING(50), allowNull: false, field: "NUMERO_AUTORIZACION" },
    mapiissCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "FK_CODIGO_MAPIISS",
    },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1, field: "CANTIDAD" },
    systemUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_USUARIO",
    },
  },
  {
    sequelize,
    tableName: "autorizacion",
    timestamps: true,
  }
);

export default Autorizacion;
