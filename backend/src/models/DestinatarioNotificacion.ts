import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Notificacion from "./Notificacion";

class DestinatarioNotificacion extends Model {
  public id!: number;
  public notificationId!: number;
  public userId!: number;
  public isRead!: boolean;
  public readAt!: Date | null;

  public notification?: Notificacion;
}

DestinatarioNotificacion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "ID",
    },
    notificationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_NOTIFICACION",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "FK_USUARIO",
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "LEIDO",
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "LEIDO_EN",
    },
  },
  {
    sequelize,
    tableName: "destinatario_notificacion",
    timestamps: false,
    indexes: [
      { fields: ["FK_NOTIFICACION"] },
      { fields: ["FK_USUARIO"] },
      { fields: ["FK_USUARIO", "LEIDO"] },
      { fields: ["FK_NOTIFICACION", "FK_USUARIO"] },
    ],
  },
);

export default DestinatarioNotificacion;
