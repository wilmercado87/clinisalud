import { Component, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

import { MaterialModule } from '../../../../shared/material/material.module';
import { RoleService } from '../../../../core/services/roles.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { MenuOption } from '../../../../models/auth.model';
import { UserResponse, PermissionOverride } from '../../../../models/user-manager.model';
import { ROLE_CODES } from '../../../../core/utils/role-constants';
import { ApiError } from '../../../../core/utils/status.codes';

export interface PermissionsDialogData {
  user: UserResponse;
}

interface PermissionMenuNode extends MenuOption {
  isUserManager: boolean;
}

@Component({
  selector: 'app-permissions-dialog',
  imports: [CommonModule, MaterialModule],
  templateUrl: './permissions-dialog.component.html',
  styleUrls: ['./permissions-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsDialogComponent {
  private readonly roleService = inject(RoleService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(MatDialogRef<PermissionsDialogComponent>);
  public readonly targetUserData = inject<PermissionsDialogData>(MAT_DIALOG_DATA);

  public systemMenusResource = rxResource({
    loader: () => this.roleService.getMenuOptions(),
  });

  public permissionMenuGroups = computed<PermissionMenuNode[]>(() => {
    const rawMenus = this.systemMenusResource.value() ?? [];
    return rawMenus.map((menuGroup) => ({
      ...menuGroup,
      isUserManager: menuGroup.label.toUpperCase() === 'GESTOR USUARIOS',
    }));
  });

  public assignedMenuOptionIds = signal<Set<number>>(new Set());
  public submitPermissionsTrigger = signal<PermissionOverride[] | null>(null);

  public updatePermissionsResource = rxResource({
    request: () => this.submitPermissionsTrigger(),
    loader: ({ request: activeOverrides }) => {
      if (!activeOverrides) return of(undefined);
      return this.userService.updatePermissions(this.targetUserData.user.id, activeOverrides);
    },
  });

  public totalMenuOptionsCount = computed(() =>
    this.permissionMenuGroups().reduce(
      (accumulatedCount, group) => accumulatedCount + 1 + (group.children?.length || 0),
      0,
    ),
  );

  public currentUserRole = computed(() => this.authService.currentUser?.role ?? '');

  public isTargetUserAdmin = computed(() => this.targetUserData.user.roleData?.code === ROLE_CODES.ADMIN);

  public isTargetUserSuperAdmin = computed(() => this.targetUserData.user.roleData?.code === ROLE_CODES.SUPER_ADMIN);

  public isEditRestricted = computed(() => this.isTargetUserSuperAdmin());

  public isNonAdminExceedingPrivileges = computed(() => {
    if (this.isEditRestricted()) return false;
    if (this.isTargetUserAdmin()) return false;

    const maxSelectableCountForNonAdmin = this.permissionMenuGroups().reduce((accumulatedCount, group) => {
      if (group.isUserManager) return accumulatedCount;
      return accumulatedCount + 1 + (group.children?.length || 0);
    }, 0);

    return (
      this.assignedMenuOptionIds().size >= maxSelectableCountForNonAdmin &&
      maxSelectableCountForNonAdmin > 0
    );
  });

  public canSubmitPermissions = computed(
    () =>
      !this.isEditRestricted() &&
      this.assignedMenuOptionIds().size > 0 &&
      !this.isNonAdminExceedingPrivileges() &&
      !this.updatePermissionsResource.isLoading() &&
      !this.systemMenusResource.isLoading(),
  );

  constructor() {
    this.initializePermissionsEffects();
  }

  private initializePermissionsEffects(): void {
    effect(() => {
      const menuGroups = this.permissionMenuGroups();
      if (menuGroups.length > 0) {
        this.loadExistingUserPermissions(menuGroups);
      }
    });

    effect(() => {
      if (this.updatePermissionsResource.value()) {
        this.toast.success('Permisos actualizados correctamente');
        this.dialogRef.close({ success: true });
      }
    });

    effect(() => {
      const synchronizationError = this.systemMenusResource.error() || this.updatePermissionsResource.error();
      if (synchronizationError) this.handlePermissionSyncError(synchronizationError);
    });
  }

  private loadExistingUserPermissions(menuGroups: PermissionMenuNode[]): void {
    const resolvedIds = this.resolveRoleBasePermissions();
    this.syncParentWithChildren(menuGroups, resolvedIds);
    this.applyAdminOverrides(menuGroups, resolvedIds);
    this.assignedMenuOptionIds.set(resolvedIds);
  }

  private resolveRoleBasePermissions(): Set<number> {
    const resolvedIds = new Set<number>();
    const roleBasePermissions = this.targetUserData.user?.roleData?.permissions || [];
    roleBasePermissions.forEach((permission) => {
      if (permission.hasAccess) {
        resolvedIds.add(Number(permission.menuOptionId));
      }
    });
    return resolvedIds;
  }

  private syncParentWithChildren(menuGroups: PermissionMenuNode[], resolvedIds: Set<number>): void {
    for (const menuGroup of menuGroups) {
      const groupKey = Number(menuGroup.id);
      const subMenuIds = menuGroup.children?.map((child) => Number(child.id)) || [];

      if (subMenuIds.length > 0) {
        const hasSelectedSubMenu = subMenuIds.some((id) => resolvedIds.has(id));
        if (hasSelectedSubMenu) {
          resolvedIds.add(groupKey);
        } else {
          resolvedIds.delete(groupKey);
        }
      }
    }
  }

  private applyAdminOverrides(menuGroups: PermissionMenuNode[], resolvedIds: Set<number>): void {
    if (this.isTargetUserSuperAdmin()) {
      this.assignedMenuOptionIds.set(resolvedIds);
      return;
    }

    const userManagerGroup = menuGroups.find((group) => group.isUserManager);
    if (userManagerGroup) {
      const groupKey = Number(userManagerGroup.id);
      const subMenuIds = userManagerGroup.children?.map((child) => Number(child.id)) || [];

      if (this.isTargetUserAdmin()) {
        resolvedIds.add(groupKey);
        subMenuIds.forEach((id) => resolvedIds.add(id));
      } else {
        resolvedIds.delete(groupKey);
        subMenuIds.forEach((id) => resolvedIds.delete(id));
      }
    }
  }

  public toggleMenuGroupSelection(menuGroup: PermissionMenuNode, isChecked: boolean): void {
    if (menuGroup.isUserManager || this.isEditRestricted() || this.updatePermissionsResource.isLoading()) return;

    const updatedIdsSet = new Set(this.assignedMenuOptionIds());
    const groupKey = Number(menuGroup.id);
    const subMenuIds = menuGroup.children?.map((child) => Number(child.id)) || [];

    if (isChecked) {
      updatedIdsSet.add(groupKey);
      subMenuIds.forEach((id) => updatedIdsSet.add(id));
    } else {
      updatedIdsSet.delete(groupKey);
      subMenuIds.forEach((id) => updatedIdsSet.delete(id));
    }
    this.assignedMenuOptionIds.set(updatedIdsSet);
  }

  public toggleSubMenuSelection(subMenuId: number, parentMenuGroup: PermissionMenuNode): void {
    if (parentMenuGroup.isUserManager || this.isEditRestricted() || this.updatePermissionsResource.isLoading()) return;

    const updatedIdsSet = new Set(this.assignedMenuOptionIds());
    const parentKey = Number(parentMenuGroup.id);
    const childKey = Number(subMenuId);
    const siblingMenuIds = parentMenuGroup.children?.map((child) => Number(child.id)) || [];

    if (updatedIdsSet.has(childKey)) {
      updatedIdsSet.delete(childKey);
      const hasActiveSiblings = siblingMenuIds.some(
        (id) => id !== childKey && updatedIdsSet.has(id),
      );
      if (!hasActiveSiblings) {
        updatedIdsSet.delete(parentKey);
      }
    } else {
      updatedIdsSet.add(childKey);
      updatedIdsSet.add(parentKey);
    }

    this.assignedMenuOptionIds.set(updatedIdsSet);
  }

  public submitPermissionOverrides(): void {
    if (!this.canSubmitPermissions()) return;

    const generatedOverrides: PermissionOverride[] = this.permissionMenuGroups().flatMap(
      (menuGroup) => {
        const groupKey = Number(menuGroup.id);
        return [
          {
            menuOptionId: groupKey,
            hasAccess: this.assignedMenuOptionIds().has(groupKey),
          },
          ...(menuGroup.children?.map((child) => ({
            menuOptionId: Number(child.id),
            hasAccess: this.assignedMenuOptionIds().has(Number(child.id)),
          })) || []),
        ];
      },
    );

    this.submitPermissionsTrigger.set(generatedOverrides);
  }

  private handlePermissionSyncError(error: unknown): void {
    const apiErr = error as ApiError;
    const feedbackMessage = apiErr.error?.message?.split(':')[1] || 'Ocurrió un error en la operación';
    this.toast.error(feedbackMessage);
    this.submitPermissionsTrigger.set(null);
  }

  public onCancel(): void {
    this.dialogRef.close({ success: false });
  }
}