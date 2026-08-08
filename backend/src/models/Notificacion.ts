import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Notificacion extends Model {
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

Notificacion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "ID",
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "TIPO",
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: "TITULO",
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "MENSAJE",
    },
    actorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_ACTOR",
    },
    actorName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: "NOMBRE_ACTOR",
    },
    actorRole: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "ROL_ACTOR",
    },
    actionUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "URL_ACCION",
    },
    actionLabel: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "ETIQUETA_ACCION",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "FECHA_CREACION",
    },
  },
  {
    sequelize,
    tableName: "notificacion",
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ["TIPO"] },
      { fields: ["ID_ACTOR"] },
      { fields: ["FECHA_CREACION"] },
    ],
  },
);

export default Notificacion;
