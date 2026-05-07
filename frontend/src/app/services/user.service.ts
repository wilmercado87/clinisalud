import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, CreateUserResponse, PermissionPayload, ToggleStatusResponse } from '../models/user-manager.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  public getManageableUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  public createUser(userData: Partial<User>): Observable<CreateUserResponse> {
    return this.http.post<CreateUserResponse>(this.apiUrl, userData);
  }

  public updatePermissions(
    userId: number,
    permissions: PermissionPayload['permissions'],
  ): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${userId}/permissions`, { permissions });
  }

  public toggleStatus(id: number): Observable<ToggleStatusResponse> {
    return this.http.patch<ToggleStatusResponse>(`${this.apiUrl}/${id}/toggle-status`, {});
  }
}
