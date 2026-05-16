import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { AuthResponse, LoginCredentials, MenuOption } from '../models/auth.model';
import { environment } from '../../environments/environment';
import { User } from '../models/user-manager.model';
import { RoleService } from './roles.services';
import { ERROR_MAPPING, HTTP_STATUS } from '../utils/status.codes';

const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  MENU: 'menu',
} as const;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private roleService = inject(RoleService);

  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private menuSubject = new BehaviorSubject<MenuOption[]>(this.getMenuFromStorage());
  public login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((res: AuthResponse) => this.saveSession(res)),
        catchError((error: HttpErrorResponse) => this.handleError(error)),
      );
  }

  private saveSession(res: AuthResponse): void {
    localStorage.setItem(STORAGE_KEYS.TOKEN, res.token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user));
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(res.menu));

    this.menuSubject.next(res.menu);
  }

  public logout(): void {
    this.roleService.clearCache();
    this.roleService.clearMenuCache();
    localStorage.clear();
    this.menuSubject.next([]);
    this.router.navigate(['/login']);
  }

  public isLoggedIn(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  public get currentUser(): User | null {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? (JSON.parse(user) as User) : null;
  }

  public get userMenu$(): Observable<MenuOption[]> {
    return this.menuSubject.asObservable();
  }

  private getMenuFromStorage(): MenuOption[] {
    const menu = localStorage.getItem(STORAGE_KEYS.MENU);
    return menu ? JSON.parse(menu) : [];
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const businessMessage = this.getErrorValidation(error);
    return throwError(() => businessMessage);
  }

  private getErrorValidation(error: HttpErrorResponse): string {
    const { status, error: body } = error;

    if (status === HTTP_STATUS.VALIDATION_ERROR) {
      const detail = body?.errors?.[0]?.message;
      if (detail) return detail;
    }

    return ERROR_MAPPING[status] || body?.message || 'Error inesperado en el servidor';
  }
}
