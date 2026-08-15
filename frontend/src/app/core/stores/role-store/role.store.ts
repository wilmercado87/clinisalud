import { Injectable, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { RoleService } from '@core/services/roles.service';
import { MenuService } from '@core/services/menu.service';
import { MenuOption } from '@core/models/user.model';
import { RoleResponse } from '@core/models/user.model';

@Injectable({ providedIn: 'root' })
export class RoleStore {
  private readonly roleService = inject(RoleService);
  private readonly menuService = inject(MenuService);

  private readonly refreshKey = signal(0);

  private readonly rolesResource = rxResource({
    request: () => this.refreshKey(),
    loader: ({ request }) => {
      if (request === 0) return of([]);
      return this.roleService.getRoles();
    },
  });

  private readonly menuOptionsResource = rxResource({
    request: () => this.refreshKey(),
    loader: ({ request }) => {
      if (request === 0) return of([]);
      return this.menuService.getMenuOptions();
    },
  });

  readonly roles = this.rolesResource.value.asReadonly();
  readonly isLoadingRoles = this.rolesResource.isLoading;

  readonly menuOptions = this.menuOptionsResource.value.asReadonly();
  readonly isLoadingMenuOptions = this.menuOptionsResource.isLoading;

  reloadRoles(): void {
    this.refreshKey.update((n) => n + 1);
  }

  reloadMenuOptions(): void {
    this.refreshKey.update((n) => n + 1);
  }

  reset(): void {
    this.roleService.clearCache();
    this.menuService.clearMenuCache();
    this.reloadRoles();
    this.reloadMenuOptions();
  }
}
