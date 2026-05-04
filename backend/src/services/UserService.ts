import * as bcrypt from "bcryptjs";
import { Op } from "sequelize";
import User from "../models/User";
import Role from "../models/Role";
import UserMenuOverride from "../models/UserMenuOverride";
import MenuOption from "../models/MenuOption";

export class UserService {
  public async findAllManageableUsers() {
    return await User.findAll({
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Role,
          as: "roleData",
          attributes: ["id", "name", "code"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }

  public async createUser(userData: any) {
    const { permissions, ...data } = userData;

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email: data.email }, { dni: data.dni }],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) throw new Error("405");
      if (existingUser.dni === data.dni) throw new Error("406");
    }

    const tempPassword = `Clini-${Math.random().toString(36).slice(-4)}!`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await User.create({
      ...data,
      password: hashedPassword,
      isActive: true,
    });

    const allMenuOptions = await MenuOption.findAll();

    const overrides = allMenuOptions.map((option) => ({
      userId: newUser.id,
      menuOptionId: option.id,
      hasAccess: permissions.includes(option.id),
    }));

    await UserMenuOverride.bulkCreate(overrides);

    const userJson = newUser.toJSON();
    delete userJson.password;

    return {
      user: userJson,
      temporaryPassword: tempPassword,
    };
  }

  public async updateUserPermissions(
    targetUserId: number,
    permissions: { menuOptionId: number; hasAccess: boolean }[],
  ) {
    const targetUser = await User.findByPk(targetUserId, {
      include: [{ model: Role, as: "roleData" }],
    });

    if (!targetUser || targetUser.roleData?.code === "ADMIN") {
      throw new Error(
        "Forbidden: No se pueden modificar permisos de un administrador.",
      );
    }

    await UserMenuOverride.destroy({ where: { userId: targetUserId } });

    const overrideData = permissions.map((p) => ({
      userId: targetUserId,
      menuOptionId: p.menuOptionId,
      hasAccess: p.hasAccess,
    }));

    return await UserMenuOverride.bulkCreate(overrideData);
  }

  public async toggleUserStatus(userId: number) {
    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: "roleData" }],
    });

    if (!user) {
      throw new Error("Usuario no encontrado.");
    }

    if (user.roleData?.code === "ADMIN") {
      throw new Error("No se puede cambiar el estado de un administrador.");
    }

    user.isActive = !user.isActive;
    await user.save();

    return {
      id: user.id,
      isActive: user.isActive,
      message: `Usuario ${user.isActive ? "activado" : "desactivado"} correctamente.`,
    };
  }
}
