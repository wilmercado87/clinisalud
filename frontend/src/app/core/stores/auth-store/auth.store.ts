import { Injectable, signal, inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { of, tap } from 'rxjs';
import { UserResponse } from '@core/models/user-manager.model';
import { MenuOption, AuthResponse, LoginRequest } from '@core/models/auth.model';
import { AuthService } from '@core/services/auth.service';
import { SocketService } from '@core/services/socket.service';
import { RoleService } from '@core/services/roles.service';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import { RoleStore } from '@core/stores/role-store/role.store';
import { UserStore } from '@features/dashboard/store/user-store/user.store';

const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  MENU: 'menu',
} as const;

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authApi = inject(AuthService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly socketService = inject(SocketService);

  private get roleService() { return this.injector.get(RoleService); }
  private get catalogStore() { return this.injector.get(CatalogStore); }
  private get roleStore() { return this.injector.get(RoleStore); }
  private get userStore() { return this.injector.get(UserStore); }

  private readonly userSignal = signal<UserResponse | null>(this.getUserFromStorage());
  private readonly menuSignal = signal<MenuOption[]>(this.getMenuFromStorage());

  private loggingOut = false;

  public readonly currentUser = this.userSignal.asReadonly();
  public readonly menu = this.menuSignal.asReadonly();

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
      if (this.isTokenExpired(token)) {
        this.logout();
        return;
      }
      this.socketService.connect(token);
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp < now;
    } catch {
      return true;
    }
  }

  public login(credentials: LoginRequest): void {
    this.loginTrigger.set(credentials);
  }

  public logout(): void {
    if (this.loggingOut) return;
    this.loggingOut = true;

    this.socketService.disconnect();
    this.roleService.clearCache();
    this.roleService.clearMenuCache();
    this.catalogStore.clearCache();
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
    this.loggingOut = false;
    this.setToken(res.token);
    this.setUser(res.user);
    this.setMenu(res.menu);
    this.socketService.connect(res.token);
    this.injector.get(RoleStore);
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
