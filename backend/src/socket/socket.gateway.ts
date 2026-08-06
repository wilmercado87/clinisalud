import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import { JWT_CONFIG } from "../constants";
import Usuario from "../models/Usuario";

let io: Server | null = null;

function resolveAllowedOrigins(): boolean | string[] {
  const raw = process.env["CORS_ORIGIN"] ?? "";
  const allowed = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return allowed.length > 0 ? allowed : true;
}

export function initSocketGateway(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: resolveAllowedOrigins(),
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", async (socket: Socket) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      socket.disconnect();
      return;
    }

    try {
      const secret = process.env["JWT_SECRET"] || JWT_CONFIG.SECRET_FALLBACK;
      const decoded = jwt.verify(token, secret) as { id: number; role: string };
      const user = await Usuario.findByPk(decoded.id);
      if (!user || !user.isActive) {
        socket.disconnect();
        return;
      }
      socket.data.userId = decoded.id;
      socket.data.role = decoded.role;

      socket.join(`user:${decoded.id}`);
    } catch {
      socket.disconnect();
    }
  });

  return io;
}

export function emitNotification(
  userId: number,
  notification: {
    id: number;
    type: string;
    title: string;
    message: string;
    actorId: number;
    actorName: string;
    actorRole: string;
    createdAt: string;
    isRead: boolean;
    readAt: string | null;
    recipientId: number;
    actionUrl?: string | null;
    actionLabel?: string | null;
  },
): void {
  if (!io) return;
  io.to(`user:${userId}`).emit("notification", notification);
}
