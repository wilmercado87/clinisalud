import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Admisiones from "./Admisiones";
import TipoAutorizacion from "./TipoAutorizacion";
import Cups from "./Cups";
import User from "./User";

class Autorizaciones extends Model {
  public id!: number;
  public admissionNumber!: string;
  public authTypeId!: number;
  public authNumber!: string;
  public mapiissCode!: string;
  public mapiissDescription!: string;
  public quantity!: number;
  public systemUserId!: number;

  public admissionData?: Admisiones;
  public authTypeData?: TipoAutorizacion;
  public cupsData?: Cups;
  public systemUserData?: User;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Autorizaciones.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    admissionNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "fk_numero_admision",
      references: { model: "admisiones", key: "admissionNumber" },
    },
    authTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fk_id_tipo_autorizacion",
      references: { model: "tipo_autorizacion", key: "id" },
    },
    authNumber: { type: DataTypes.STRING(50), allowNull: false, field: "numero_autorizacion" },
    mapiissCode: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "fk_codigo_mapiiss",
      references: { model: "cups", key: "mapiissCode" },
    },
    mapiissDescription: { type: DataTypes.TEXT, allowNull: false, field: "descripcion_mapiiss" },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1, field: "cantidad" },
    systemUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id_usuario_sistema",
      references: { model: "users", key: "id" },
    },
  },
  {
    sequelize,
    tableName: "autorizaciones",
    timestamps: true,
  }
);

export default Autorizaciones;