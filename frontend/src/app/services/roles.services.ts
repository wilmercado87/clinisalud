import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';
import { Role } from '../models/user-manager.model';
import { MenuOption } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/roles`;

  private rolesCache$?: Observable<Role[]>;

  getRoles(): Observable<Role[]> {
    if (!this.rolesCache$) {
      this.rolesCache$ = this.http.get<Role[]>(this.apiUrl).pipe(
        shareReplay(1),
      );
    }

    return this.rolesCache$;
  }

  getMenuOptions(): Observable<MenuOption[]> {
    return this.http.get<MenuOption[]>(`${this.apiUrl}/menus`);
  }

  clearCache(): void {
    this.rolesCache$ = undefined;
  }
}
