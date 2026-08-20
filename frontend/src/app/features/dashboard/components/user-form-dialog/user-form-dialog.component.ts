import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { CreateUserRequest, MenuOption } from '@core/models/user.model';
import { ToastService } from '@core/services/toast.service';
import { AuthStore } from '@core/stores/auth-store/auth.store';
import { RoleStore } from '@core/stores/role-store/role.store';
import { UserStore } from '@features/dashboard/store/user-store/user.store';
import {
  allMenuOptionIds,
  collectGroupIds,
  isUserManagerGroup,
  toggleChildSelection,
  toggleParentSelection,
} from '@features/dashboard/utils/menu-selection-utils';
import { USER_ERROR_RULES } from '@features/dashboard/utils/user-form-validator';
import { CatalogSelectComponent } from '@shared/components/catalog-select/catalog-select.component';
import { extractFieldErrors } from '@shared/utils/form-field-errors';
import { getBusinessErrorMessage, getHttpErrorMessage } from '@shared/utils/http-error';
import { USER_MESSAGES } from '@shared/utils/messages';
import { ROLE_CODES } from '@shared/utils/role-constants';
import { ERROR_MAPPING, HTTP_STATUS } from '@shared/utils/status.codes';

const ALREADY_EXISTS_FIELD: Record<string, string> = {
  EMAIL_EXISTS: 'email',
  DNI_EXISTS: 'dni',
};

@Component({
  selector: 'app-user-form-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    CatalogSelectComponent,
  ],
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

  private readonly roleIdSignal = toSignal(this.userForm.controls['roleId'].valueChanges, {
    initialValue: this.userForm.controls['roleId'].value,
  });

  private formSubmitted = false;

  public selectedIds = signal<Set<number>>(new Set());
  public created = signal(false);
  public emailSent = signal(false);
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
    return items.filter((r) => r.code !== ROLE_CODES.SUPER_ADMIN);
  });

  public isAdmin = computed(() => {
    const roleId = this.roleIdSignal();
    const items = this.roles() ?? [];
    const selectedRole = items.find((r) => r.id === roleId);
    return selectedRole?.code === ROLE_CODES.ADMIN || selectedRole?.code === ROLE_CODES.SUPER_ADMIN;
  });

  public isSuperAdminRole = computed(() => {
    const roleId = this.roleIdSignal();
    const items = this.roles() ?? [];
    return items.find((r) => r.id === roleId)?.code === ROLE_CODES.SUPER_ADMIN;
  });

  public isPermissionsLocked = computed(() => this.isSuperAdminRole());

  public filteredMenuOptions = computed(() => {
    const items = this.menuOptions() ?? [];
    const roleId = this.roleIdSignal();
    const selectedRole = (this.roles() ?? []).find((r) => r.id === roleId);
    const hideGestor =
      selectedRole?.code === ROLE_CODES.MEDICO ||
      selectedRole?.code === ROLE_CODES.FACTURADOR ||
      selectedRole?.code === ROLE_CODES.ADMISIONES;
    if (!hideGestor) return items;
    return items.filter((g) => !isUserManagerGroup(g));
  });

  private gestorUsuariosIds = computed<Set<number>>(() => {
    const group = (this.menuOptions() ?? []).find(isUserManagerGroup);
    if (!group) return new Set();
    return new Set(collectGroupIds(group));
  });

  public isGestorUsuariosForced = computed(() => {
    const roleId = this.roleIdSignal();
    const items = this.roles() ?? [];
    const selectedRole = items.find((r) => r.id === roleId);
    return selectedRole?.code === ROLE_CODES.ADMIN;
  });

  public effectiveSelectedIds = computed(() => {
    const ids = new Set(this.selectedIds());
    if (this.isGestorUsuariosForced()) {
      this.gestorUsuariosIds().forEach((id) => ids.add(id));
    }
    return ids;
  });

  public canSubmit = computed(
    () => this.formStatus() === 'VALID' && this.effectiveSelectedIds().size > 0 && !this.isCreating(),
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
      if (res && this.formSubmitted) {
        this.created.set(true);
        this.emailSent.set(res.emailSent === true);
        this.toast.success(USER_MESSAGES.USER_CREATED);
      }
    });

    effect(() => {
      const error = this.createError();
      if (error) this.handleCreationError(error);
    });
  }

  public toggleParent(group: MenuOption, isChecked: boolean): void {
    if (this.isGestorUsuariosForced() && isUserManagerGroup(group)) return;

    this.selectedIds.set(toggleParentSelection(this.selectedIds(), group, isChecked));
  }

  public toggleChild(childId: number, parent: MenuOption): void {
    if (this.isGestorUsuariosForced() && isUserManagerGroup(parent)) return;

    this.selectedIds.set(toggleChildSelection(this.selectedIds(), parent, childId));
  }

  private selectAllPermissions(): void {
    const all = allMenuOptionIds(this.filteredMenuOptions());
    this.selectedIds.set(new Set(all));
  }

  public onSubmit(): void {
    if (!this.canSubmit()) return;
    const roleId = this.userForm.controls.roleId.value;
    if (roleId === null) return;

    this.formSubmitted = true;
    this.userStore.createUser(this.buildPayload(roleId));
  }

  private buildPayload(roleId: number): CreateUserRequest {
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
    const code = err instanceof HttpErrorResponse ? err.error?.code : undefined;

    const field = code ? ALREADY_EXISTS_FIELD[code] : undefined;
    if (field) this.userForm.get(field)?.setErrors({ alreadyExists: true });

    const errorMessage =
      err instanceof HttpErrorResponse
        ? getHttpErrorMessage(err, '') || getBusinessErrorMessage(err)
        : ERROR_MAPPING[HTTP_STATUS.INTERNAL_SERVER_ERROR];
    this.toast.error(errorMessage);
  }

  public close(refresh = false): void {
    this.dialogRef.close(refresh);
  }
}
