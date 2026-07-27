import { Component, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';

import { MaterialModule } from '../../../../shared/material/material.module';
import { UserStore } from '../../store/user-store/user.store';
import { RoleStore } from '../../../../core/stores/role-store/role.store';
import { AuthStore } from '../../../../core/stores/auth-store/auth.store';
import { ToastService } from '../../../../core/services/toast.service';

import { MenuOption } from '../../../../core/models/auth.model';
import { ERROR_MAPPING, HTTP_STATUS, ApiError } from '../../../../shared/utils/status.codes';
import { ROLE_CODES } from '../../../../shared/utils/role-constants';

@Component({
  selector: 'app-user-form-dialog',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './user-form-dialog.component.html',
  styleUrls: ['./user-form-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userStore = inject(UserStore);
  private readonly roleStore = inject(RoleStore);
  private readonly authStore = inject(AuthStore);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(MatDialogRef<UserFormDialogComponent>);

  public userForm = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    dni: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern('^[0-9]{7,10}$')]],
    address: [''],
    roleId: [null as number | null, Validators.required],
  });

  public readonly roles = this.roleStore.roles;
  public readonly isLoadingRoles = this.roleStore.isLoadingRoles;
  public readonly menuOptions = this.roleStore.menuOptions;
  public readonly isLoadingMenuOptions = this.roleStore.isLoadingMenuOptions;

  public readonly isCreating = this.userStore.isCreating;
  public readonly createResult = this.userStore.createResult;
  public readonly createError = this.userStore.createError;

  private readonly roleIdSignal = toSignal(
    this.userForm.controls.roleId.valueChanges,
    { initialValue: this.userForm.controls.roleId.value }
  );

  public selectedIds = signal<Set<number>>(new Set());
  public generatedPassword = signal('');
  public formStatus = toSignal(this.userForm.statusChanges, { initialValue: this.userForm.status });

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

  public filteredMenuOptions = computed(() =>
    (this.menuOptions() ?? []).filter(item => item.label === 'Panel Principal')
  );

  public totalOptionsCount = computed(() =>
    this.filteredMenuOptions().reduce((acc, group) => acc + 1 + (group.children?.length || 0), 0)
  );

  public isFullAccessDenied = computed(() => {
    if (this.isAdmin()) return false;
    const total = this.totalOptionsCount();
    return total > 0 && this.selectedIds().size >= total;
  });

  public canSubmit = computed(() =>
    this.formStatus() === 'VALID' &&
    this.selectedIds().size > 0 &&
    !this.isFullAccessDenied() &&
    !this.isCreating()
  );

  constructor() {
    this.registerEffects();
  }

  private registerEffects(): void {
    effect(() => {
      const is_admin = this.isAdmin();
      const options = this.filteredMenuOptions();

      if (is_admin && options.length > 0) {
        this.selectAllPermissions();
      } else {
        this.selectedIds.set(new Set());
      }
    });

    effect(() => {
      const res = this.createResult();
      if (res?.temporaryPassword) {
        this.generatedPassword.set(res.temporaryPassword);
        this.toast.success('¡Usuario registrado con éxito!');
      }
    });

    effect(() => {
      const error = this.createError() as ApiError;
      if (error) this.handleCreationError(error);
    });
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

    this.userStore.createUser(this.buildPayload(this.userForm.getRawValue()));
  }

  private buildPayload(rawForm: Record<string, unknown>): {
    firstName: string; lastName: string; dni: string; email: string;
    phone?: string; address?: string; roleId: number; permissions: number[];
  } {
    const cleanFields = Object.fromEntries(
      Object.entries(rawForm).map(([key, value]) => [
        key, 
        value === null ? undefined : value
      ])
    );

    return {
      ...cleanFields as { firstName: string; lastName: string; dni: string; email: string; phone?: string; address?: string; roleId: number; },
      permissions: Array.from(this.selectedIds())
    };
  }

  private handleCreationError(err: unknown): void {
    const httpErr = err as any;
    const errorCode = httpErr.error?.code as string | undefined;
    const statusCode = httpErr.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;

    const codeToField: Record<string, string> = {
      EMAIL_EXISTS: 'email',
      DNI_EXISTS: 'dni',
    };

    const codeToMessageKey: Record<string, number> = {
      EMAIL_EXISTS: HTTP_STATUS.EMAIL_ALREADY_EXISTS,
      DNI_EXISTS: HTTP_STATUS.DNI_ALREADY_EXISTS,
    };

    const field = errorCode ? codeToField[errorCode] : undefined;
    if (field) {
      this.userForm.get(field)?.setErrors({ alreadyExists: true });
    }

    const messageKey = errorCode ? codeToMessageKey[errorCode] : undefined;
    const errorMessage = (messageKey && ERROR_MAPPING[messageKey])
      || ERROR_MAPPING[statusCode]
      || ERROR_MAPPING[HTTP_STATUS.INTERNAL_SERVER_ERROR];
    this.toast.error(errorMessage);
  }

  public close(refresh = false): void {
    this.dialogRef.close(refresh);
  }
}
