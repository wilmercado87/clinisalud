import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

let io: Server | null = null;

export function initSocketGateway(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      socket.disconnect();
      return;
    }

    try {
      const jwt = require("jsonwebtoken");
      const secret = process.env["JWT_SECRET"] || "clinisalud_secret";
      const decoded = jwt.verify(token, secret) as { id: number; role: string };
      socket.data.userId = decoded.id;
      socket.data.role = decoded.role;

      socket.join(`user:${decoded.id}`);
    } catch {
      socket.disconnect();
    }
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.IO not initialized");
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
