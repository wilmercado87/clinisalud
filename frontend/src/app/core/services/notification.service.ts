import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { NotificationResponse, UnreadCountResponse } from '@core/models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  public getNotifications(limit = 5, offset = 0): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(this.apiUrl, {
      params: { limit, offset: String(offset) },
    });
  }

  public getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`);
  }

  public markAsRead(recipientId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${recipientId}/read`, {});
  }

  public markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/read-all`, {});
  }
}
