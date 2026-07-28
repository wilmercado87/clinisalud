import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '@env/environment';
import { NotificationResponse } from '@core/models/notification-dto.model';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  public readonly onNotification = signal<NotificationResponse | null>(null);

  public connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.apiUrl.replace('/api', ''), {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Conectado');
    });

    this.socket.on('notification', (data: NotificationResponse) => {
      this.onNotification.set(data);
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Desconectado');
    });
  }

  public disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
