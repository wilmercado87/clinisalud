import { Component, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatOptionModule } from '@angular/material/core';

import { CreatePayload, UserStore } from '@features/dashboard/store/user-store/user.store';
import { RoleStore } from '@core/stores/role-store/role.store';
import { AuthStore } from '@core/stores/auth-store/auth.store';
import { ToastService } from '@core/services/toast.service';
import { MenuOption } from '@core/models/auth.model';
import { ERROR_MAPPING, HTTP_STATUS } from '@shared/utils/status.codes';
import { CatalogSelectComponent } from '@shared/components/catalog-select/catalog-select.component';
import { ROLE_CODES } from '@shared/utils/role-constants';
import { USER_ERROR_RULES } from '@features/dashboard/utils/user-form-validator';
import { extractFieldErrors } from '@shared/utils/form-field-errors';

const ALREADY_EXISTS_FIELD: Record<string, string> = {
  EMAIL_EXISTS: 'email',
  DNI_EXISTS: 'dni',
};

@Component({
  selector: 'app-user-form-dialog',
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule, MatCheckboxModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, CatalogSelectComponent],
  templateUrl: './user-form-dialog.component.html',
  styleUrl: './user-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userStore = inject(UserStore);
  private readonly roleStore = inject(RoleStore);
  private readonly authStore = inject(AuthStore);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(MatDialogRef<UserFormDialogComponent>);

  public readonly roles = this.roleStore.roles;
  public readonly isLoadingRoles = this.roleStore.isLoadingRoles;
  public readonly menuOptions = this.roleStore.menuOptions;
  public readonly isLoadingMenuOptions = this.roleStore.isLoadingMenuOptions;
  public readonly isCreating = this.userStore.isCreating;
  public readonly createResult = this.userStore.createResult;
  public readonly createError = this.userStore.createError;

  public userForm = this.fb.group({
    documentTypeId: [null as number | null, Validators.required],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    dni: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern('^[0-9]{7,10}$')]],
    address: [''],
    roleId: [null as number | null, Validators.required],
  });

  private readonly roleIdSignal = toSignal(
    this.userForm.controls['roleId'].valueChanges,
    { initialValue: this.userForm.controls['roleId'].value }
  );

  private formSubmitted = false;

  public selectedIds = signal<Set<number>>(new Set());
  public generatedPassword = signal('');
  public formStatus = toSignal(this.userForm.statusChanges, { initialValue: this.userForm.status });

  public userErrors = computed(() => {
    this.formStatus();
    return extractFieldErrors(this.userForm, USER_ERROR_RULES);
  });

  public currentUserRole = computed(() => this.authStore.currentUser()?.role ?? '');
  public isCurrentUserSuperAdmin = computed(() => this.currentUserRole() === ROLE_CODES.SUPER_ADMIN);

  public availableRoles = computed(() => {
    const items = this.roles() ?? [];
    if (this.isCurrentUserSuperAdmin()) return items;
    return items.filter(r => r.code !== ROLE_CODES.SUPER_ADMIN);
  });

  public isAdmin = computed(() => {
    const roleId = this.roleIdSignal();
    const items = this.roles() ?? [];
    const selectedRole = items.find(r => r.id === roleId);
    return selectedRole?.code === ROLE_CODES.ADMIN || selectedRole?.code === ROLE_CODES.SUPER_ADMIN;
  });

  public isSuperAdminRole = computed(() => {
    const roleId = this.roleIdSignal();
    const items = this.roles() ?? [];
    return items.find(r => r.id === roleId)?.code === ROLE_CODES.SUPER_ADMIN;
  });

  public isPermissionsLocked = computed(() => this.isSuperAdminRole());

  public filteredMenuOptions = computed(() => {
    const items = this.menuOptions() ?? [];
    const roleId = this.roleIdSignal();
    const selectedRole = (this.roles() ?? []).find(r => r.id === roleId);
    const hideGestor = selectedRole?.code === ROLE_CODES.MEDICO || selectedRole?.code === ROLE_CODES.FACTURADOR;
    if (!hideGestor) return items;
    return items.filter(g => g.label.toUpperCase() !== 'GESTOR USUARIOS');
  });

  private gestorUsuariosIds = computed<Set<number>>(() => {
    const group = (this.menuOptions() ?? []).find(
      g => g.label.toUpperCase() === 'GESTOR USUARIOS'
    );
    if (!group) return new Set();
    return new Set([group.id, ...(group.children?.map(c => c.id) ?? [])]);
  });

  public isGestorUsuariosForced = computed(() => {
    const roleId = this.roleIdSignal();
    const items = this.roles() ?? [];
    const selectedRole = items.find(r => r.id === roleId);
    return selectedRole?.code === ROLE_CODES.ADMIN;
  });

  public effectiveSelectedIds = computed(() => {
    const ids = new Set(this.selectedIds());
    if (this.isGestorUsuariosForced()) {
      this.gestorUsuariosIds().forEach(id => ids.add(id));
    }
    return ids;
  });

  public canSubmit = computed(() =>
    this.formStatus() === 'VALID' &&
    this.effectiveSelectedIds().size > 0 &&
    !this.isCreating()
  );

  constructor() {
    if (this.menuOptions()?.length === 0) {
      this.roleStore.reloadMenuOptions();
    }
    this.registerEffects();
  }

  private registerEffects(): void {
    effect(() => {
      const is_admin = this.isAdmin();
      const options = this.filteredMenuOptions();

      if (is_admin && options.length > 0) {
        this.selectAllPermissions();
      }
    });

    effect(() => {
      const res = this.createResult();
      if (res?.temporaryPassword && this.formSubmitted) {
        this.generatedPassword.set(res.temporaryPassword);
        this.toast.success('¡Usuario registrado con éxito!');
      }
    });

    effect(() => {
      const error = this.createError();
      if (error) this.handleCreationError(error);
    });
  }

  public toggleParent(group: MenuOption, isChecked: boolean): void {
    if (this.isGestorUsuariosForced() && group.label.toUpperCase() === 'GESTOR USUARIOS') return;

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
    if (this.isGestorUsuariosForced() && parent.label.toUpperCase() === 'GESTOR USUARIOS') return;

    const newSet = new Set(this.selectedIds());
    const childIds = parent.children?.map(c => c.id) || [];
    const isChildSelected = newSet.has(childId);

    if (isChildSelected) {
      newSet.delete(childId);
      const hasSelectedSiblings = childIds.some(id => id !== childId && newSet.has(id));
      if (!hasSelectedSiblings) newSet.delete(parent.id);
    } else {
      newSet.add(childId);
      newSet.add(parent.id);
    }

    this.selectedIds.set(newSet);
  }

  private selectAllPermissions(): void {
    const all = this.filteredMenuOptions().flatMap(
      g => [g.id, ...(g.children?.map(c => c.id) || [])]
    );
    this.selectedIds.set(new Set(all));
  }

  public onSubmit(): void {
    if (!this.canSubmit()) return;
    const roleId = this.userForm.controls.roleId.value;
    if (roleId === null) return;

    this.formSubmitted = true;
    this.userStore.createUser(this.buildPayload(roleId));
  }

  private buildPayload(roleId: number): CreatePayload {
    const raw = this.userForm.getRawValue();
    return {
      documentTypeId: raw.documentTypeId ?? undefined,
      firstName: raw.firstName ?? '',
      lastName: raw.lastName ?? '',
      dni: raw.dni ?? '',
      email: raw.email ?? '',
      phone: raw.phone || undefined,
      address: raw.address || undefined,
      roleId,
      permissions: Array.from(this.effectiveSelectedIds()),
    };
  }

  private handleCreationError(err: unknown): void {
    const { code, status, message } = this.resolveError(err);

    const field = code ? ALREADY_EXISTS_FIELD[code] : undefined;
    if (field) this.userForm.get(field)?.setErrors({ alreadyExists: true });

    const errorMessage =
      message ?? ERROR_MAPPING[status] ?? ERROR_MAPPING[HTTP_STATUS.INTERNAL_SERVER_ERROR];
    this.toast.error(errorMessage);
  }

  private resolveError(err: unknown): { code?: string; status: number; message?: string } {
    if (err instanceof HttpErrorResponse) {
      return {
        code: err.error?.code,
        status: err.status,
        message: err.error?.message,
      };
    }
    return { status: HTTP_STATUS.INTERNAL_SERVER_ERROR };
  }

  public close(refresh = false): void {
    this.dialogRef.close(refresh);
  }
}
