import { Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './permissions-dialog.component.html',
  styleUrls: ['./permissions-dialog.component.scss'],
})
export class PermissionsDialogComponent implements OnInit {
  // Servicios
  private readonly roleService = inject(RoleService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(MatDialogRef<PermissionsDialogComponent>);
  private readonly destroyRef = inject(DestroyRef);

  // Data e Inyectores
  public readonly data = inject<PermissionsDialogData>(MAT_DIALOG_DATA);

  // Estado Reactivo (Signals)
  public menuOptions = signal<MenuOption[]>([]);
  public selectedIds = signal<Set<number>>(new Set());
  public isLoading = signal(false);
  public isSaving = signal(false);

  // Computed Properties (Reglas de Negocio)
  public totalOptionsCount = computed(() =>
    this.menuOptions().reduce((acc, opt) => acc + 1 + (opt.children?.length || 0), 0)
  );

  public isAdmin = computed(() => this.data.user.roleData?.code === 'ADMIN');

  public isFullAccessDenied = computed(() => {
    if (this.isAdmin()) return false;
    return this.selectedIds().size >= this.totalOptionsCount() && this.totalOptionsCount() > 0;
  });

  public canSubmit = computed(() => 
    this.selectedIds().size > 0 && !this.isFullAccessDenied() && !this.isSaving() && !this.isLoading()
  );

  ngOnInit(): void {
    this.loadMenuOptions();
  }

  private loadMenuOptions(): void {
    this.isLoading.set(true);
    this.roleService.getMenuOptions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (menu) => {
          this.menuOptions.set(menu);
          this.initializeUserPermissions();
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.toast.error('No se pudieron cargar las opciones del menú');
        }
      });
  }

  private initializeUserPermissions(): void {
    const permissions = this.data.user.roleData?.permissions || [];
    const initialSet = new Set<number>();

    permissions.forEach(p => {
      if (p.hasAccess) initialSet.add(p.menuOptionId);
    });

    this.selectedIds.set(initialSet);
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

    this.isSaving.set(true);

    const permissions: PermissionOverride[] = this.menuOptions().flatMap(group => [
      { menuOptionId: group.id, hasAccess: this.selectedIds().has(group.id) },
      ...(group.children?.map(child => ({
        menuOptionId: child.id,
        hasAccess: this.selectedIds().has(child.id)
      })) || [])
    ]);

    this.userService.updatePermissions(this.data.user.id, permissions)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Permisos actualizados correctamente');
          this.dialogRef.close({ success: true });
        },
        error: (err) => {
          this.isSaving.set(false);
          this.toast.error(err.error?.message || 'Error al guardar permisos');
        }
      });
  }

  public onCancel(): void {
    this.dialogRef.close({ success: false });
  }
}