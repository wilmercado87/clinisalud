import { Component, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

import { MaterialModule } from '../../../material/material.module';
import { RoleService } from '../../../services/roles.services';
import { UserService } from '../../../services/user.service';
import { ToastService } from '../../../services/toast.service';
import { MenuOption } from '../../../models/auth.model';
import { User, PermissionOverride } from '../../../models/user-manager.model';

export interface PermissionsDialogData {
  user: User;
}

interface LocalMenuOption extends MenuOption {
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
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(MatDialogRef<PermissionsDialogComponent>);
  public readonly data = inject<PermissionsDialogData>(MAT_DIALOG_DATA);

  public menuResource = rxResource({
    loader: () => this.roleService.getMenuOptions(),
  });

  public menuOptions = computed<LocalMenuOption[]>(() => {
    const rawMenu = this.menuResource.value() ?? [];
    return rawMenu.map((group) => ({
      ...group,
      isUserManager: group.label.toUpperCase() === 'GESTOR USUARIOS',
    }));
  });

  public selectedIds = signal<Set<number>>(new Set());
  public saveTrigger = signal<PermissionOverride[] | null>(null);

  public saveResource = rxResource({
    request: () => this.saveTrigger(),
    loader: ({ request: perms }) => {
      if (!perms) return of(undefined);
      return this.userService.updatePermissions(this.data.user.id, perms);
    },
  });

  public totalOptionsCount = computed(() =>
    this.menuOptions().reduce(
      (acc, opt) => acc + 1 + (opt.children?.length || 0),
      0,
    ),
  );

  public isAdmin = computed(() => this.data.user.roleData?.code === 'ADMIN');

  public isFullAccessDenied = computed(() => {
    if (this.isAdmin()) return false;

    const selectableCountForNonAdmin = this.menuOptions().reduce((acc, opt) => {
      if (opt.isUserManager) return acc; 
      return acc + 1 + (opt.children?.length || 0);
    }, 0);

    return (
      this.selectedIds().size >= selectableCountForNonAdmin &&
      selectableCountForNonAdmin > 0
    );
  });

  public canSubmit = computed(
    () =>
      this.selectedIds().size > 0 &&
      !this.isFullAccessDenied() &&
      !this.saveResource.isLoading() &&
      !this.menuResource.isLoading(),
  );

  constructor() {
    this.registerEffects();
  }

  private registerEffects(): void {
    effect(() => {
      const menu = this.menuOptions();
      if (menu.length > 0) {
        this.initializeUserPermissions(menu);
      }
    });

    effect(() => {
      if (this.saveResource.value()) {
        this.toast.success('Permisos actualizados correctamente');
        this.dialogRef.close({ success: true });
      }
    });

    effect(() => {
      const error = this.menuResource.error() || this.saveResource.error();
      if (error) this.handleErrors(error);
    });
  }

  private initializeUserPermissions(menu: LocalMenuOption[]): void {
    const ids = new Set<number>();

    const backendPermissions = this.data.user?.roleData?.permissions || [];
    backendPermissions.forEach((p) => {
      if (p.hasAccess) {
        ids.add(Number(p.menuOptionId));
      }
    });

    for (const group of menu) {
      const groupKey = Number(group.id);
      const childIds = group.children?.map((c) => Number(c.id)) || [];

      if (childIds.length > 0) {
        const hasSelectedChild = childIds.some((id) => ids.has(id));
        if (hasSelectedChild) {
          ids.add(groupKey);
        } else {
          ids.delete(groupKey);
        }
      }
    }

    const userManagerGroup = menu.find((g) => g.isUserManager);
    if (userManagerGroup) {
      const groupKey = Number(userManagerGroup.id);
      const childIds = userManagerGroup.children?.map((c) => Number(c.id)) || [];

      if (this.isAdmin()) {
        ids.add(groupKey);
        childIds.forEach((id) => ids.add(id));
      } else {
        ids.delete(groupKey);
        childIds.forEach((id) => ids.delete(id));
      }
    }

    this.selectedIds.set(ids);
  }

  public toggleParent(group: LocalMenuOption, isChecked: boolean): void {
    if (group.isUserManager || this.saveResource.isLoading()) return;

    const newSet = new Set(this.selectedIds());
    const groupKey = Number(group.id);
    const childIds = group.children?.map((c) => Number(c.id)) || [];

    if (isChecked) {
      newSet.add(groupKey);
      childIds.forEach((id) => newSet.add(id));
    } else {
      newSet.delete(groupKey);
      childIds.forEach((id) => newSet.delete(id));
    }
    this.selectedIds.set(newSet);
  }

  public toggleChild(childId: number, parent: LocalMenuOption): void {
    if (parent.isUserManager || this.saveResource.isLoading()) return;

    const newSet = new Set(this.selectedIds());
    const parentKey = Number(parent.id);
    const childKey = Number(childId);
    const childIds = parent.children?.map((c) => Number(c.id)) || [];

    if (newSet.has(childKey)) {
      newSet.delete(childKey);
      const hasSelectedSiblings = childIds.some(
        (id) => id !== childKey && newSet.has(id),
      );
      if (!hasSelectedSiblings) {
        newSet.delete(parentKey);
      }
    } else {
      newSet.add(childKey);
      newSet.add(parentKey);
    }

    this.selectedIds.set(newSet);
  }

  public onSave(): void {
    if (!this.canSubmit()) return;

    const permissions: PermissionOverride[] = this.menuOptions().flatMap(
      (group) => {
        const groupKey = Number(group.id);
        return [
          {
            menuOptionId: groupKey,
            hasAccess: this.selectedIds().has(groupKey),
          },
          ...(group.children?.map((child) => ({
            menuOptionId: Number(child.id),
            hasAccess: this.selectedIds().has(Number(child.id)),
          })) || []),
        ];
      },
    );

    this.saveTrigger.set(permissions);
  }

  private handleErrors(err: any): void {
    const msg = err.error?.message || 'Ocurrió un error en la operación';
    this.toast.error(msg);
    this.saveTrigger.set(null);
  }

  public onCancel(): void {
    this.dialogRef.close({ success: false });
  }
}