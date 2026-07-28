import { Injectable, signal, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { of, tap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { UserResponse } from '@core/models/user-manager.model';
import { MenuOption, AuthResponse, LoginRequest } from '@core/models/auth.model';
import { AuthApiService } from '@core/services/auth-api.service';
import { RoleService } from '@core/services/roles.service';
import { SocketService } from '@core/services/socket.service';

const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  MENU: 'menu',
} as const;

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly roleService = inject(RoleService);
  private readonly socketService = inject(SocketService);

  private readonly userSignal = signal<UserResponse | null>(this.getUserFromStorage());
  private readonly menuSignal = signal<MenuOption[]>(this.getMenuFromStorage());

  public readonly currentUser = this.userSignal.asReadonly();
  public readonly menu = this.menuSignal.asReadonly();
  public readonly currentUser$ = toObservable(this.currentUser);
  public readonly userMenu$ = toObservable(this.menu);

  private readonly loginTrigger = signal<LoginRequest | null>(null);

  private readonly loginResource = rxResource({
    request: () => this.loginTrigger(),
    loader: ({ request: credentials }) => {
      if (!credentials) return of(undefined);
      return this.authApi.login(credentials).pipe(
        tap((res) => this.saveSession(res)),
      );
    },
  });

  readonly loginResult = this.loginResource.value.asReadonly();
  readonly isLoggingIn = this.loginResource.isLoading;
  readonly loginError = this.loginResource.error;

  private readonly updateTrigger = signal<{
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
  } | null>(null);

  private readonly updateResource = rxResource({
    request: () => this.updateTrigger(),
    loader: ({ request: data }) => {
      if (!data) return of(undefined);
      return this.authApi.updateProfile(data).pipe(
        tap((updatedUser) => {
          const current = this.currentUser();
          if (current) {
            const merged = { ...current, ...updatedUser };
            this.setUser(merged);
          }
        }),
      );
    },
  });

  readonly updateResult = this.updateResource.value.asReadonly();
  readonly isUpdatingProfile = this.updateResource.isLoading;
  readonly updateError = this.updateResource.error;

  constructor() {
    const token = this.getToken();
    if (token) {
      this.socketService.connect(token);
    }
  }

  public login(credentials: LoginRequest): void {
    this.loginTrigger.set(credentials);
  }

  public logout(): void {
    this.socketService.disconnect();
    this.roleService.clearCache();
    this.roleService.clearMenuCache();
    this.clear();
    this.router.navigate(['/login']);
  }

  public isLoggedIn(): boolean {
    return !!this.getToken();
  }

  public updateProfile(data: Partial<{ firstName: string; lastName: string; phone: string; address: string }>): void {
    this.updateTrigger.set(data);
  }

  public updateStoredUser(user: UserResponse): void {
    this.setUser(user);
  }

  public setUser(user: UserResponse | null): void {
    this.userSignal.set(user);
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }

  public setMenu(menu: MenuOption[]): void {
    this.menuSignal.set(menu);
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menu));
  }

  public getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  private setToken(token: string | null): void {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  }

  private clear(): void {
    this.userSignal.set(null);
    this.menuSignal.set([]);
    localStorage.clear();
  }

  private saveSession(res: AuthResponse): void {
    this.setToken(res.token);
    this.setUser(res.user);
    this.setMenu(res.menu);
    this.socketService.connect(res.token);
  }

  private getUserFromStorage(): UserResponse | null {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? (JSON.parse(user) as UserResponse) : null;
  }

  private getMenuFromStorage(): MenuOption[] {
    const menu = localStorage.getItem(STORAGE_KEYS.MENU);
    return menu ? JSON.parse(menu) : [];
  }
}
