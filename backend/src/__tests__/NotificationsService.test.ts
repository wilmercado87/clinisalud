jest.mock("../socket/socket.gateway", () => ({
  emitNotification: jest.fn(),
}));

jest.mock("../models/Notificacion", () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

jest.mock("../models/DestinatarioNotificacion", () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    count: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    bulkCreate: jest.fn(),
  },
}));

jest.mock("../models/Usuario", () => ({
  __esModule: true,
  default: { findAll: jest.fn() },
}));

jest.mock("../models/Rol", () => ({
  __esModule: true,
  default: {},
}));

import { NotificationsService } from "../modules/notifications/notifications.service";
import Notificacion from "../models/Notificacion";
import DestinatarioNotificacion from "../models/DestinatarioNotificacion";
import Usuario from "../models/Usuario";
import { emitNotification } from "../socket/socket.gateway";

const mockNotification = {
  id: 1,
  type: "USER_CREATED",
  title: "Nuevo usuario registrado",
  message: "Juan Perez creado",
  actorId: 2,
  actorName: "Admin",
  actorRole: "ADMIN",
  actionUrl: "/dashboard/users",
  actionLabel: "Ver usuarios",
  createdAt: new Date("2026-08-05T12:00:00Z"),
};

describe("NotificationsService (@spec:INV-SEC-04)", () => {
  let service: NotificationsService;

  beforeEach(() => {
    service = new NotificationsService();
    jest.clearAllMocks();
  });

  describe("createAndDispatch", () => {
    it("should create notification and notify active admins via socket", async () => {
      (Notificacion.create as jest.Mock).mockResolvedValue(mockNotification);
      (Usuario.findAll as jest.Mock).mockResolvedValue([
        { id: 10, email: "admin1@test.com" },
        { id: 11, email: "admin2@test.com" },
      ]);
      (DestinatarioNotificacion.bulkCreate as jest.Mock).mockImplementation(
        (rows: Array<{ userId: number }>) => rows.map((r, index) => ({ ...r, id: 100 + index })),
      );

      await service.createAndDispatch({
        type: "USER_CREATED",
        title: "Nuevo usuario registrado",
        message: "Juan Perez creado",
        actorId: 2,
        actorName: "Admin",
        actorRole: "ADMIN",
      });

      expect(DestinatarioNotificacion.bulkCreate).toHaveBeenCalledWith([
        { notificationId: 1, userId: 10 },
        { notificationId: 1, userId: 11 },
      ]);
      expect(emitNotification).toHaveBeenCalledTimes(2);
      expect(emitNotification).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ id: 1, type: "USER_CREATED", recipientId: 100 }),
      );
    });

    it("should not emit when there are no admin recipients", async () => {
      (Notificacion.create as jest.Mock).mockResolvedValue(mockNotification);
      (Usuario.findAll as jest.Mock).mockResolvedValue([]);
      (DestinatarioNotificacion.bulkCreate as jest.Mock).mockResolvedValue([]);

      await service.createAndDispatch({
        type: "USER_CREATED",
        title: "Nuevo usuario registrado",
        message: "Mensaje",
        actorId: 2,
        actorName: "Admin",
        actorRole: "ADMIN",
      });

      expect(emitNotification).not.toHaveBeenCalled();
    });
  });

  describe("markAsRead", () => {
    it("should mark as read only own notification", async () => {
      const save = jest.fn().mockResolvedValue(true);
      (DestinatarioNotificacion.findByPk as jest.Mock).mockResolvedValue({
        notificationId: 1,
        userId: 10,
        isRead: false,
        save,
      });

      await service.markAsRead(5, 10);

      expect(save).toHaveBeenCalled();
    });

    it("should throw forbidden when recipient belongs to another user", async () => {
      (DestinatarioNotificacion.findByPk as jest.Mock).mockResolvedValue({
        notificationId: 1,
        userId: 99,
        isRead: false,
        save: jest.fn(),
      });

      await expect(service.markAsRead(5, 10)).rejects.toThrow("prohibido");
    });

    it("should throw notFound for invalid id (NaN guard)", async () => {
      await expect(service.markAsRead(Number.NaN, 10)).rejects.toThrow("no encontrado");
      expect(DestinatarioNotificacion.findByPk).not.toHaveBeenCalled();
    });
  });

  describe("getUnreadCount", () => {
    it("should return the unread count of the user", async () => {
      (DestinatarioNotificacion.count as jest.Mock).mockResolvedValue(3);

      const count = await service.getUnreadCount(10);

      expect(count).toBe(3);
      expect(DestinatarioNotificacion.count).toHaveBeenCalledWith({
        where: { userId: 10, isRead: false },
      });
    });
  });
});
