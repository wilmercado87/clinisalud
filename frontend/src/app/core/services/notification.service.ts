import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationItem, UnreadCountResponse } from '../../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  public getNotifications(limit = 5, offset = 0): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(this.apiUrl, {
      params: { limit, offset: String(offset) },
    });
  }

  public getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`);
  }

  public markAsRead(recipientId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${recipientId}/read`, {});
  }

  public markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/read-all`, {});
  }
}
