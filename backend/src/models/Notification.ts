import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Notification extends Model {
  public id!: number;
  public type!: string;
  public title!: string;
  public message!: string;
  public actorId!: number;
  public actorName!: string;
  public actorRole!: string;
  public actionUrl?: string | null;
  public actionLabel?: string | null;
  public createdAt!: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    actorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    actorName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    actorRole: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    actionUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "action_url",
    },
    actionLabel: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "action_label",
    },
  },
  {
    sequelize,
    tableName: "notifications",
    timestamps: true,
    updatedAt: false,
  },
);

export default Notification;
