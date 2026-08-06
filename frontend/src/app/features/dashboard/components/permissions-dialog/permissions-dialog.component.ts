import { Component, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { RoleStore } from '@core/stores/role-store/role.store';
import { UserStore } from '@features/dashboard/store/user-store/user.store';
import { AuthStore } from '@core/stores/auth-store/auth.store';
import { ToastService } from '@core/services/toast.service';
import { MenuOption, UserResponse } from '@core/models/user.model';
import { ROLE_CODES } from '@shared/utils/role-constants';
import { getHttpErrorMessage } from '@shared/utils/http-error';
import { APP_MESSAGES, USER_MESSAGES } from '@shared/utils/messages';
import {
  allMenuOptionIds,
  buildPermissionOverrides,
  isUserManagerGroup,
  toggleChildSelection,
  toggleParentSelection,
} from '@features/dashboard/utils/menu-selection-utils';

export interface PermissionsDialogData {
  user: UserResponse;
}

interface PermissionMenuNode extends MenuOption {
  isUserManager: boolean;
}

@Component({
  selector: 'app-permissions-dialog',
  imports: [CommonModule, MatDialogModule, MatIconModule, MatCheckboxModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './permissions-dialog.component.html',
  styleUrl: './permissions-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsDialogComponent {
  private readonly roleStore = inject(RoleStore);
  private readonly userStore = inject(UserStore);
  private readonly authStore = inject(AuthStore);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(MatDialogRef<PermissionsDialogComponent>);

  public readonly targetUserData = inject<PermissionsDialogData>(MAT_DIALOG_DATA);

  public readonly menuOptions = this.roleStore.menuOptions;
  public readonly isLoadingMenuOptions = this.roleStore.isLoadingMenuOptions;
  public readonly isUpdatingPermissions = this.userStore.isUpdatingPermissions;
  public readonly updatePermissionsResult = this.userStore.updatePermissionsResult;
  public readonly updatePermissionsError = this.userStore.updatePermissionsError;

  public assignedMenuOptionIds = signal<Set<number>>(new Set());

  public permissionMenuGroups = computed<PermissionMenuNode[]>(() => {
    const rawMenus = this.menuOptions() ?? [];
    return rawMenus.map((menuGroup) => ({
      ...menuGroup,
      isUserManager: isUserManagerGroup(menuGroup),
    }));
  });

  public totalMenuOptionsCount = computed(() =>
    allMenuOptionIds(this.permissionMenuGroups()).length,
  );

  public currentUserRole = computed(() => this.authStore.currentUser()?.role ?? '');

  public isTargetUserAdmin = computed(() => this.targetUserData.user.roleData?.code === ROLE_CODES.ADMIN);

  public isTargetUserSuperAdmin = computed(() => this.targetUserData.user.roleData?.code === ROLE_CODES.SUPER_ADMIN);

  public isEditRestricted = computed(() => this.isTargetUserSuperAdmin());

  public isNonAdminExceedingPrivileges = computed(() => {
    if (this.isEditRestricted()) return false;
    if (this.isTargetUserAdmin()) return false;

    const selectableGroups = this.permissionMenuGroups().filter(
      (group) => !group.isUserManager,
    );
    const maxSelectableCountForNonAdmin = allMenuOptionIds(selectableGroups).length;

    return (
      this.assignedMenuOptionIds().size > maxSelectableCountForNonAdmin &&
      maxSelectableCountForNonAdmin > 0
    );
  });

  public canSubmitPermissions = computed(
    () =>
      !this.isEditRestricted() &&
      this.assignedMenuOptionIds().size > 0 &&
      !this.isNonAdminExceedingPrivileges() &&
      !this.isUpdatingPermissions() &&
      !this.isLoadingMenuOptions(),
  );

  constructor() {
    if (this.menuOptions()?.length === 0) {
      this.roleStore.reloadMenuOptions();
    }
    this.initializePermissionsEffects();
  }

  private initializePermissionsEffects(): void {
    effect(() => {
      const menuGroups = this.permissionMenuGroups();
      const loading = this.isLoadingMenuOptions();
      const userId = this.targetUserData?.user?.id;
      if (!loading && menuGroups.length > 0 && userId) {
        this.loadExistingUserPermissions(menuGroups);
      }
    });

    effect(() => {
      if (this.updatePermissionsResult()) {
        this.toast.success(USER_MESSAGES.PERMISSIONS_UPDATED);
        this.dialogRef.close({ success: true });
      }
    });

    effect(() => {
      const synchronizationError = this.updatePermissionsError();
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
    if (menuGroup.isUserManager || this.isEditRestricted() || this.isUpdatingPermissions()) return;

    this.assignedMenuOptionIds.set(
      toggleParentSelection(this.assignedMenuOptionIds(), menuGroup, isChecked),
    );
  }

  public toggleSubMenuSelection(subMenuId: number, parentMenuGroup: PermissionMenuNode): void {
    if (parentMenuGroup.isUserManager || this.isEditRestricted() || this.isUpdatingPermissions()) return;

    this.assignedMenuOptionIds.set(
      toggleChildSelection(this.assignedMenuOptionIds(), parentMenuGroup, subMenuId),
    );
  }

  public submitPermissionOverrides(): void {
    if (!this.canSubmitPermissions()) return;

    const generatedOverrides = buildPermissionOverrides(
      this.permissionMenuGroups(),
      this.assignedMenuOptionIds(),
    );

    this.userStore.updatePermissions(this.targetUserData.user.id, generatedOverrides);
  }

  private handlePermissionSyncError(error: unknown): void {
    this.toast.error(getHttpErrorMessage(error, APP_MESSAGES.OPERATION_ERROR));
  }

  public onCancel(): void {
    this.dialogRef.close({ success: false });
  }
}
