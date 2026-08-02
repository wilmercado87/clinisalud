import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Usuario from "../../models/Usuario";
import Rol from "../../models/Rol";
import OpcionMenu from "../../models/OpcionMenu";
import SobreescrituraMenuUsuario from "../../models/SobreescrituraMenuUsuario";
import PermisoRolMenu from "../../models/PermisoRolMenu";
import { buildMenuTree } from "../../utils/MenuTree.util";
import { JWT_CONFIG } from "../../constants";
import { ApiError } from "../../middlewares/ErrorHandlerMiddleware";
import { generateTempPassword } from "../../utils/Password.util";
import { EmailService } from "../notifications/email.service";
import { logError } from "../../utils/Logger";
import { toSafeUserJson } from "../../utils/user.mapper";
import { MenuOptionResponse } from "../users/users.types";
import { ChangePasswordRequest, LoginResponse, UpdateProfileRequest } from "./auth.types";

export class AuthService {
  private readonly emailService = new EmailService();

  public async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await Usuario.findOne({ where: { email } });
    if (user) {
      await this.resetPasswordAndNotify(user);
    }
    return { message: "Si el correo existe, recibirás una contraseña temporal para iniciar sesión" };
  }

  private async resetPasswordAndNotify(user: Usuario): Promise<void> {
    const tempPassword = generateTempPassword();
    user.password = await bcrypt.hash(tempPassword, 10);
    await user.save();

    try {
      await this.emailService.sendTemporaryPassword(
        user.email,
        `${user.firstName} ${user.lastName}`,
        tempPassword,
      );
    } catch (error) {
      logError("No se pudo enviar la contraseña temporal recuperada", {
        userId: user.id,
        email: user.email,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  public async login(email: string, pass: string): Promise<LoginResponse> {
    const user = await Usuario.findOne({
      where: { email },
      include: [{ model: Rol, as: "roleData" }],
    });

    if (!user) throw ApiError.unauthorized("Usuario no encontrado");
    if (!(await bcrypt.compare(pass, user.password))) throw ApiError.unauthorized("Credenciales inválidas");
    if (!user.isActive) throw ApiError.forbidden("Usuario inactivo");

    const [menu, token] = await Promise.all([
      this.getAuthorizedMenu(user.id, user.roleId),
      this.generateToken(user),
    ]);

    return {
      user: { ...toSafeUserJson(user), role: user.roleData?.code },
      menu,
      token,
    };
  }

  private async getAuthorizedMenu(userId: number, roleId: number): Promise<MenuOptionResponse[]> {
    const role = await Rol.findByPk(roleId);
    const isAdmin = role?.code === "ADMIN" || role?.code === "SUPER_ADMIN";

    const [rolePermissions, overrides] = await Promise.all([
      PermisoRolMenu.findAll({ where: { roleId } }),
      SobreescrituraMenuUsuario.findAll({ where: { userId } }),
    ]);

    const authorizedIds = new Set(rolePermissions.map((p) => p.menuOptionId));

    for (const override of overrides) {
      if (override.hasAccess) {
        authorizedIds.add(override.menuOptionId);
      } else {
        authorizedIds.delete(override.menuOptionId);
      }
    }

    if (isAdmin) {
      const gestorOption = await OpcionMenu.findOne({ where: { label: "Gestor Usuarios" } });
      if (gestorOption) authorizedIds.add(gestorOption.id);
    }

    if (authorizedIds.size === 0) return [];

    const authorizedOptions = await OpcionMenu.findAll({
      where: { id: Array.from(authorizedIds) },
      order: [["order", "ASC"]],
    });

    const menuMap = this.buildOptionMap(authorizedOptions);
    await this.ensureParentHierarchy(menuMap);

    return buildMenuTree(Array.from(menuMap.values()));
  }

  private buildOptionMap(options: OpcionMenu[]): Map<number, MenuOptionResponse> {
    const map = new Map<number, MenuOptionResponse>();
    for (const opt of options) {
      map.set(opt.id, opt.get({ plain: true }) as MenuOptionResponse);
    }
    return map;
  }

  private async ensureParentHierarchy(map: Map<number, MenuOptionResponse>): Promise<void> {
    const parentIdsMissing = Array.from(map.values())
      .filter((opt) => opt.parentId && !map.has(opt.parentId))
      .map((opt) => opt.parentId as number);

    if (parentIdsMissing.length === 0) return;

    const missingParents = await OpcionMenu.findAll({ where: { id: parentIdsMissing } });
    for (const parent of missingParents) {
      map.set(parent.id, parent.get({ plain: true }) as MenuOptionResponse);
    }

    await this.ensureParentHierarchy(map);
  }

  public async updateProfile(userId: number, data: UpdateProfileRequest) {
    const user = await Usuario.findByPk(userId);
    if (!user) throw ApiError.notFound("Usuario no encontrado");

    await this.assertEmailAvailable(data.email, user.email);

    this.applyProfileUpdates(user, data);
    await user.save();

    return toSafeUserJson(user);
  }

  private async assertEmailAvailable(
    newEmail: string | undefined,
    currentEmail: string,
  ): Promise<void> {
    if (newEmail === undefined || newEmail === currentEmail) return;
    const existing = await Usuario.findOne({ where: { email: newEmail } });
    if (existing) throw ApiError.emailExists();
  }

  private applyProfileUpdates(user: Usuario, data: UpdateProfileRequest): void {
    if (data.email !== undefined) user.email = data.email;
    if (data.firstName !== undefined) user.firstName = data.firstName;
    if (data.lastName !== undefined) user.lastName = data.lastName;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.address !== undefined) user.address = data.address;
  }

  public async changePassword(userId: number, data: ChangePasswordRequest) {
    const user = await Usuario.findByPk(userId);
    if (!user) throw ApiError.notFound("Usuario no encontrado");

    if (!(await bcrypt.compare(data.currentPassword, user.password))) {
      throw ApiError.badRequest("La contraseña actual no es correcta");
    }

    if (await bcrypt.compare(data.newPassword, user.password)) {
      throw ApiError.badRequest("La nueva contraseña debe ser diferente a la actual");
    }

    user.password = await bcrypt.hash(data.newPassword, 10);
    await user.save();

    return { message: "Contraseña actualizada correctamente" };
  }

  private generateToken(user: Usuario): string {
    return jwt.sign(
      { id: user.id, role: user.roleData?.code, email: user.email },
      process.env["JWT_SECRET"] || "clinisalud_secret",
      { expiresIn: JWT_CONFIG.EXPIRES_IN },
    );
  }
}
