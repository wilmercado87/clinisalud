import { Injectable, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RoleService } from '@core/services/roles.service';
import { MenuService } from '@core/services/menu.service';
import { MenuOption } from '@core/models/user.model';
import { RoleResponse } from '@core/models/user.model';

@Injectable({ providedIn: 'root' })
export class RoleStore {
  private readonly roleService = inject(RoleService);
  private readonly menuService = inject(MenuService);

  private readonly rolesResource = rxResource({
    loader: () => this.roleService.getRoles(),
  });

  private readonly menuOptionsResource = rxResource({
    loader: () => this.menuService.getMenuOptions(),
  });

  readonly roles = this.rolesResource.value.asReadonly();
  readonly isLoadingRoles = this.rolesResource.isLoading;

  readonly menuOptions = this.menuOptionsResource.value.asReadonly();
  readonly isLoadingMenuOptions = this.menuOptionsResource.isLoading;

  reloadRoles(): void {
    this.rolesResource.reload();
  }

  reloadMenuOptions(): void {
    this.menuOptionsResource.reload();
  }

  reset(): void {
    this.roleService.clearCache();
    this.menuService.clearMenuCache();
    this.reloadRoles();
    this.reloadMenuOptions();
  }
}
