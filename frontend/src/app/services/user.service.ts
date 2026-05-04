import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay, Observable } from 'rxjs';
import { User, CreateUserResponse } from '../models/user-manager.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  public getManageableUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl)
  }

  public createUser(userData: Partial<User>): Observable<CreateUserResponse> {
    return this.http.post<CreateUserResponse>(this.apiUrl, userData);
  }

  public updatePermissions(
    userId: number,
    permissions: any[],
  ): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${userId}/permissions`, {
      permissions,
    });
  }

  toggleStatus(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/toggle-status`, {});
  }
}
