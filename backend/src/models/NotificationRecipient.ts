import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class NotificationRecipient extends Model {
  public id!: number;
  public notificationId!: number;
  public userId!: number;
  public isRead!: boolean;
  public readAt!: Date | null;
}

NotificationRecipient.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    notificationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "notification_id",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_read",
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "read_at",
    },
  },
  {
    sequelize,
    tableName: "notification_recipients",
    timestamps: false,
  },
);

export default NotificationRecipient;
