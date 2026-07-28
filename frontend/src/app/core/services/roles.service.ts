import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '@env/environment';
import { RoleResponse } from '@core/models/user-manager.model';
import { MenuOption } from '@core/models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/roles`;

  private rolesCache$?: Observable<RoleResponse[]>;
  private menuCache$?: Observable<MenuOption[]>;

  getRoles(): Observable<RoleResponse[]> {
    this.rolesCache$ ??= this.http
        .get<RoleResponse[]>(this.apiUrl)
        .pipe(shareReplay(1));

    return this.rolesCache$;
  }

  getMenuOptions(): Observable<MenuOption[]> {
    this.menuCache$ ??= this.http
        .get<MenuOption[]>(`${this.apiUrl}/menus`)
        .pipe(shareReplay(1));
    return this.menuCache$;
  }

  clearCache(): void {
    this.rolesCache$ = undefined;
  }

  clearMenuCache(): void {
    this.menuCache$ = undefined;
  }
}
