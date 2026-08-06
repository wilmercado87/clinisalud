import * as bcrypt from "bcryptjs";
import { Op } from "sequelize";
import Usuario from "../../models/Usuario";
import Rol from "../../models/Rol";
import OpcionMenu from "../../models/OpcionMenu";
import SobreescrituraMenuUsuario from "../../models/SobreescrituraMenuUsuario";
import PermisoRolMenu from "../../models/PermisoRolMenu";
import { ApiError } from "../../middlewares/ErrorHandlerMiddleware";
import {
  ERROR_MESSAGES,
  ERROR_MESSAGES_USERS,
  USER_NOTIFICATIONS,
  USER_STATUS_ACTIONS,
} from "../../constants";
import { formatMessage } from "../../utils/formatMessage";
import TipoDocumento from "../../models/TipoDocumento";
import { buildMenuTree } from "../../utils/MenuTree.util";
import { NotificationsService } from "../notifications/notifications.service";
import { EmailService } from "../notifications/email.service";
import { generateTempPassword } from "../../utils/Password.util";
import { logError } from "../../utils/Logger";
import { toSafeUserJson } from "../../utils/user.mapper";
import {
  CreateUserRequest,
  CreateUserResult,
  ManageableUserResponse,
  MenuOptionResponse,
  PermissionOverride,
  ToggleStatusResponse,
} from "./users.types";

interface RoleHierarchyMessages {
  superAdmin: string;
  admin: string;
}

interface ManageableUserRecord {
  id: number;
  firstName: string;
  lastName: string;
  documentTypeId: number;
  dni: string;
  email: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  roleId: number;
  createdAt: Date;
  updatedAt: Date;
  roleData?: { id: number; name: string; code: string } | null;
  menuOverrides?: Array<{ menuOptionId: number; hasAccess: boolean }> | null;
}

export class UsersService {
  private readonly notificationsService = new NotificationsService();
  private readonly emailService = new EmailService();

  public async findAllRoles(): Promise<Rol[]> {
    return await Rol.findAll({ order: [["name", "ASC"]] });
  }

  public async findAllMenuOptions(): Promise<MenuOptionResponse[]> {
    const options = await OpcionMenu.findAll({
      where: { isActive: true },
      order: [["order", "ASC"]],
    });
    return buildMenuTree(options.map((opt) => opt.toJSON() as MenuOptionResponse));
  }

  public async findAllManageableUsers(): Promise<ManageableUserResponse[]> {
    const users = await Usuario.findAll({
      attributes: { exclude: ["password"] },
      include: [
        { model: Rol, as: "roleData", attributes: ["id", "name", "code"] },
        { model: SobreescrituraMenuUsuario, as: "menuOverrides" },
      ],
      order: [["createdAt", "DESC"]],
    });

    const grantedMenuIdsByRole = await this.loadGrantedMenuIdsByRole(users);
    return users.map((user) => this.toManageableUser(user, grantedMenuIdsByRole));
  }

  private async loadGrantedMenuIdsByRole(users: Usuario[]): Promise<Map<number, number[]>> {
    const roleIds = [
      ...new Set(
        users
          .map((u) => (u.toJSON() as ManageableUserRecord).roleData?.id)
          .filter((id): id is number => typeof id === "number"),
      ),
    ];
    if (roleIds.length === 0) return new Map();

    const rolePerms = await PermisoRolMenu.findAll({ where: { roleId: roleIds } });
    const grantedByRole = new Map<number, number[]>();
    for (const perm of rolePerms) {
      const ids = grantedByRole.get(perm.roleId) ?? [];
      ids.push(perm.menuOptionId);
      grantedByRole.set(perm.roleId, ids);
    }
    return grantedByRole;
  }

  private toManageableUser(
    user: Usuario,
    grantedMenuIdsByRole: Map<number, number[]>,
  ): ManageableUserResponse {
    const json = user.toJSON() as ManageableUserRecord;
    const { menuOverrides, roleData, ...rest } = json;
    if (!roleData) return { ...rest, role: undefined, roleData: undefined };

    return {
      ...rest,
      role: roleData.code,
      roleData: {
        ...roleData,
        permissions: this.resolvePermissionsFromArrays(
          grantedMenuIdsByRole.get(roleData.id) ?? [],
          menuOverrides ?? [],
        ),
      },
    };
  }

  private resolvePermissionsFromArrays(
    grantedMenuIds: number[],
    overrides: Array<{ menuOptionId: number; hasAccess: boolean }>,
  ): PermissionOverride[] {
    const overrideMap = new Map<number, boolean>(
      overrides.map((o) => [Number(o.menuOptionId), Boolean(o.hasAccess)]),
    );

    const allMenuIds = new Set<number>([...grantedMenuIds, ...overrideMap.keys()]);

    return Array.from(allMenuIds)
      .sort((a, b) => a - b)
      .map((menuOptionId) => ({
        menuOptionId,
        hasAccess: overrideMap.has(menuOptionId)
          ? overrideMap.get(menuOptionId)!
          : grantedMenuIds.includes(menuOptionId),
      }))
      .filter((p) => p.hasAccess);
  }

  public async createUser(
    data: CreateUserRequest,
    requestingUserRole: string,
    requestingUserId: number,
    requestingUserName: string,
  ): Promise<CreateUserResult> {
    const targetRole = await Rol.findByPk(data.roleId);
    const isTargetAdmin = targetRole?.code === "ADMIN" || targetRole?.code === "SUPER_ADMIN";
    if (isTargetAdmin && requestingUserRole !== "SUPER_ADMIN") {
      throw ApiError.forbidden(ERROR_MESSAGES.CREATE_ADMIN_FORBIDDEN);
    }

    await this.assertNoDuplicate(data);

    const tempPassword = generateTempPassword();
    const newUser = await this.createUserRecord(data, tempPassword);
    await this.createPermissionOverrides(newUser.id, data.roleId, data.permissions);

    const userJson = toSafeUserJson(newUser);
    this.notifyUserCreated(data, targetRole?.name ?? null, requestingUserRole, requestingUserId, requestingUserName);
    const emailSent = await this.sendWelcomeEmailWithLog(data, newUser.id, tempPassword);

    return { user: userJson, emailSent };
  }

  private async assertNoDuplicate(data: CreateUserRequest): Promise<void> {
    const existingUser = await Usuario.findOne({ where: { [Op.or]: [{ email: data.email }, { dni: data.dni }] } });
    if (!existingUser) return;
    if (existingUser.email === data.email) throw ApiError.emailExists(ERROR_MESSAGES.EMAIL_EXISTS);
    if (existingUser.dni === data.dni) throw ApiError.conflict(ERROR_MESSAGES.DNI_EXISTS);
  }

  private async createUserRecord(data: CreateUserRequest, tempPassword: string): Promise<Usuario> {
    const ccDocument = await TipoDocumento.findOne({ where: { code: "CC" } });
    const defaultDocumentTypeId = ccDocument ? ccDocument.id : 3;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    return await Usuario.create({
      ...data,
      documentTypeId: data.documentTypeId || defaultDocumentTypeId,
      password: hashedPassword,
      isActive: true,
    });
  }

  private async createPermissionOverrides(
    userId: number,
    roleId: number,
    permissions: number[],
  ): Promise<void> {
    const rolePerms = await PermisoRolMenu.findAll({ where: { roleId } });
    const selectedSet = new Set(permissions);
    const allMenuIds = new Set([
      ...rolePerms.map((p) => p.menuOptionId),
      ...permissions,
    ]);

    const overrides = Array.from(allMenuIds).map((menuOptionId) => ({
      userId,
      menuOptionId,
      hasAccess: selectedSet.has(menuOptionId),
    }));

    if (overrides.length > 0) {
      await SobreescrituraMenuUsuario.bulkCreate(overrides);
    }
  }

  private notifyUserCreated(
    data: CreateUserRequest,
    targetRoleName: string | null,
    requestingUserRole: string,
    requestingUserId: number,
    requestingUserName: string,
  ): void {
    const config = USER_NOTIFICATIONS.USER_CREATED;
    this.notificationsService
      .createAndDispatch({
        type: config.type,
        title: config.title,
        message: formatMessage(config.messageTemplate, {
          actorName: requestingUserName,
          actorRole: requestingUserRole,
          firstName: data.firstName,
          lastName: data.lastName,
          roleName: targetRoleName ?? ERROR_MESSAGES_USERS.NO_ROLE,
        }),
        actorId: requestingUserId,
        actorName: requestingUserName,
        actorRole: requestingUserRole,
        actionUrl: config.actionUrl,
        actionLabel: config.actionLabel,
      })
      .catch(() => {});
  }

  private async sendWelcomeEmailWithLog(
    data: CreateUserRequest,
    userId: number,
    tempPassword: string,
  ): Promise<boolean> {
    try {
      await this.emailService.sendTemporaryPassword(data.email, `${data.firstName} ${data.lastName}`, tempPassword);
      return true;
    } catch (error) {
      logError("No se pudo enviar la contraseña temporal al usuario creado", {
        userId,
        email: data.email,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  public async updateUserPermissions(
    targetUserId: number,
    permissions: PermissionOverride[],
    requestingUserRole: string,
  ) {
    const targetUser = await Usuario.findByPk(targetUserId, {
      include: [{ model: Rol, as: "roleData" }],
    });
    if (!targetUser) throw ApiError.notFound(ERROR_MESSAGES.USER_NOT_FOUND);

    this.assertTargetRoleEditable(targetUser.roleData?.code, requestingUserRole, {
      superAdmin: ERROR_MESSAGES.PERMISSIONS_SUPER_ADMIN_FORBIDDEN,
      admin: ERROR_MESSAGES.PERMISSIONS_ADMIN_FORBIDDEN,
    });

    await SobreescrituraMenuUsuario.destroy({ where: { userId: targetUserId } });

    const overrideData = permissions.map((p) => ({
      userId: targetUserId,
      menuOptionId: p.menuOptionId,
      hasAccess: p.hasAccess,
    }));

    return await SobreescrituraMenuUsuario.bulkCreate(overrideData);
  }

  public async toggleUserStatus(
    userId: number,
    requestingUserRole: string,
    requestingUserId: number,
    requestingUserName: string,
  ): Promise<ToggleStatusResponse> {
    const user = await Usuario.findByPk(userId, {
      include: [{ model: Rol, as: "roleData" }],
    });
    if (!user) throw ApiError.notFound(ERROR_MESSAGES.USER_NOT_FOUND);

    this.assertTargetRoleEditable(user.roleData?.code, requestingUserRole, {
      superAdmin: ERROR_MESSAGES.STATUS_SUPER_ADMIN_FORBIDDEN,
      admin: ERROR_MESSAGES.STATUS_ADMIN_FORBIDDEN,
    });

    user.isActive = !user.isActive;
    await user.save();

    const action = user.isActive ? USER_STATUS_ACTIONS.ACTIVATED : USER_STATUS_ACTIONS.DEACTIVATED;
    const config = USER_NOTIFICATIONS.USER_TOGGLED;
    this.notificationsService
      .createAndDispatch({
        type: config.type,
        title: formatMessage(config.title, { action }),
        message: formatMessage(config.messageTemplate, {
          actorName: requestingUserName,
          actorRole: requestingUserRole,
          action,
          firstName: user.firstName,
          lastName: user.lastName,
        }),
        actorId: requestingUserId,
        actorName: requestingUserName,
        actorRole: requestingUserRole,
        actionUrl: config.actionUrl,
        actionLabel: config.actionLabel,
      })
      .catch(() => {});

    return {
      id: user.id,
      isActive: user.isActive,
      message: formatMessage(ERROR_MESSAGES_USERS.USER_STATUS_TOGGLED_MSG, {
        statusLabel: action,
      }),
    };
  }

  private assertTargetRoleEditable(
    targetRoleCode: string | null | undefined,
    requestingRole: string,
    messages: RoleHierarchyMessages,
  ): void {
    if (targetRoleCode === "SUPER_ADMIN") throw ApiError.forbidden(messages.superAdmin);
    if (targetRoleCode === "ADMIN" && requestingRole !== "SUPER_ADMIN") {
      throw ApiError.forbidden(messages.admin);
    }
  }
}
