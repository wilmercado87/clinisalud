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

@Component({
  selector: 'app-permissions-dialog',
  imports: [CommonModule, MaterialModule],
  templateUrl: './permissions-dialog.component.html',
  styleUrls: ['./permissions-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PermissionsDialogComponent {
  private readonly roleService = inject(RoleService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(MatDialogRef<PermissionsDialogComponent>);
  public readonly data = inject<PermissionsDialogData>(MAT_DIALOG_DATA);

  public menuResource = rxResource({
    loader: () => this.roleService.getMenuOptions()
  });

  public menuOptions = computed(() => {
  const rawMenu = this.menuResource.value() ?? [];
  const is_admin = this.isAdmin(); // Capturamos la señal

  return rawMenu.filter(item => {
    const label = item.label.toUpperCase();

    if (label === 'Gestor Usuarios') {
      return is_admin;
    }

    return true;
  });
});

  public selectedIds = signal<Set<number>>(new Set());
  public saveTrigger = signal<PermissionOverride[] | null>(null);

  public saveResource = rxResource({
    request: () => this.saveTrigger(),
    loader: ({ request: perms }) => {
      if (!perms) return of(undefined);
      return this.userService.updatePermissions(this.data.user.id, perms);
    }
  });

  public totalOptionsCount = computed(() =>
    this.menuOptions().reduce((acc, opt) => acc + 1 + (opt.children?.length || 0), 0)
  );

  public isAdmin = computed(() => this.data.user.roleData?.code === 'ADMIN');

  public isFullAccessDenied = computed(() => {
    if (this.isAdmin()) return false;
    const selectedCount = this.selectedIds().size;
    const total = this.totalOptionsCount();
    return total > 0 && selectedCount >= total;
  });

  public canSubmit = computed(() =>
    this.selectedIds().size > 0 &&
    !this.isFullAccessDenied() &&
    !this.saveResource.isLoading() &&
    !this.menuResource.isLoading()
  );

  constructor() {
    this.registerEffects();
  }

  private registerEffects(): void {
    effect(() => {
      if (this.menuResource.value()) {
        this.initializeUserPermissions();
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

  private initializeUserPermissions(): void {
    const currentPermissions = this.data.user?.roleData?.permissions || [];
    const ids = currentPermissions.map(p => p.menuOptionId);
    this.selectedIds.set(new Set(ids));
  }

  public toggleParent(group: MenuOption, isChecked: boolean): void {
    const newSet = new Set(this.selectedIds());
    const childIds = group.children?.map(c => c.id) || [];

    if (isChecked) {
      newSet.add(group.id);
      childIds.forEach(id => newSet.add(id));
    } else {
      newSet.delete(group.id);
      childIds.forEach(id => newSet.delete(id));
    }
    this.selectedIds.set(newSet);
  }

  public toggleChild(childId: number, parent: MenuOption): void {
    const newSet = new Set(this.selectedIds());
    if (newSet.has(childId)) {
      newSet.delete(childId);
    } else {
      newSet.add(childId);
      newSet.add(parent.id);
    }
    this.selectedIds.set(newSet);
  }

  public isParentChecked(group: MenuOption): boolean {
    const childIds = group.children?.map(c => c.id) || [];
    if (childIds.length === 0) return this.selectedIds().has(group.id);
    return childIds.every(id => this.selectedIds().has(id));
  }

  public onSave(): void {
    if (!this.canSubmit()) return;

    const permissions: PermissionOverride[] = this.menuOptions().flatMap(group => [
      { menuOptionId: group.id, hasAccess: this.selectedIds().has(group.id) },
      ...(group.children?.map(child => ({
        menuOptionId: child.id,
        hasAccess: this.selectedIds().has(child.id)
      })) || [])
    ]);

    this.saveTrigger.set(permissions);
  }

  private handleErrors(err: any): void {
    const msg = err.error?.message?.split(':')[1] || 'Ocurrió un error en la operación';
    this.toast.error(msg);
    this.saveTrigger.set(null);
  }

  public onCancel(): void {
    this.dialogRef.close({ success: false });
  }
}