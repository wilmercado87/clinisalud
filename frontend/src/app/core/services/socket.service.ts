import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { NotificationItem } from '../../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  public readonly onNotification = signal<NotificationItem | null>(null);

  public connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.apiUrl.replace('/api', ''), {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Conectado');
    });

    this.socket.on('notification', (data: NotificationItem) => {
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
