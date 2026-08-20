import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  CreateUserRequest,
  CreateUserResponse,
  PermissionsRequest,
  ToggleStatusResponse,
  UserResponse,
} from '@core/models/user.model';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  public getManageableUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(this.apiUrl);
  }

  public createUser(userData: CreateUserRequest): Observable<CreateUserResponse> {
    return this.http.post<CreateUserResponse>(this.apiUrl, userData);
  }

  public updatePermissions(userId: number, permissions: PermissionsRequest['permissions']): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${userId}/permissions`, { permissions });
  }

  public toggleStatus(id: number): Observable<ToggleStatusResponse> {
    return this.http.post<ToggleStatusResponse>(`${this.apiUrl}/${id}/toggle-status`, {});
  }
}
