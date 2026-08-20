import { computed, Injectable, signal } from '@angular/core';
import { NotificationResponse } from '@core/models/notification.model';
import { environment } from '@env/environment';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  private readonly notificationEvent = signal<{
    payload: NotificationResponse | null;
    seq: number;
  }>({ payload: null, seq: 0 });

  public readonly onNotification = computed(() => this.notificationEvent().payload);
  public readonly notificationSeq = computed(() => this.notificationEvent().seq);

  public connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.apiUrl.replace('/api', ''), {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('notification', (data: NotificationResponse) => {
      this.notificationEvent.update((state) => ({ payload: data, seq: state.seq + 1 }));
    });
  }

  public disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.notificationEvent.set({ payload: null, seq: 0 });
  }
}
