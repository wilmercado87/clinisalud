import { Injectable, inject, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RoleService } from '../../services/roles.service';
import { MenuOption } from '../../models/auth.model';
import { RoleResponse } from '../../models/user-manager.model';

@Injectable({ providedIn: 'root' })
export class RoleStore {
  private readonly roleService = inject(RoleService);

  private readonly rolesResource = rxResource({
    loader: () => this.roleService.getRoles(),
  });

  private readonly menuOptionsResource = rxResource({
    loader: () => this.roleService.getMenuOptions(),
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
}
