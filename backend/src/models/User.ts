import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Role from "./Role";

class User extends Model {
  public id!: number;
  public firstName!: string;
  public lastName!: string;
  public dni!: string;
  public email!: string;
  public password!: string;
  public phone!: string;
  public address!: string;
  public isActive!: boolean;
  public roleId!: number;
  public roleData?: Role;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "first_name",
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "last_name",
    },
    dni: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.STRING,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "role_id",
      references: {
        model: "roles",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
  },
);

User.belongsTo(Role, {
  foreignKey: "roleId",
  as: "roleData",
});

Role.hasMany(User, {
  foreignKey: "roleId",
  as: "users",
});

export default User;
