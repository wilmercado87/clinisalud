import { Component, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

import { MaterialModule } from '../../../../shared/material/material.module';
import { UserService } from '../../services/user.service';
import { RoleService } from '../../../../core/services/roles.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

import { MenuOption } from '../../../../models/auth.model';
import { ERROR_MAPPING, HTTP_STATUS } from '../../../../core/utils/status.codes';
import { User } from '../../../../models/user-manager.model';

type CreateUserPayload = Partial<User> & { permissions: number[] };

@Component({
  selector: 'app-user-form-dialog',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './user-form-dialog.component.html',
  styleUrls: ['./user-form-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  private readonly authService = inject(AuthService);
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

  public rolesResource = rxResource({ loader: () => this.roleService.getRoles() });
  public menuResource = rxResource({ loader: () => this.roleService.getMenuOptions() });

  public createTrigger = signal<CreateUserPayload | null>(null);
  public saveResource = rxResource({
    request: () => this.createTrigger(),
    loader: ({ request: data }) => data ? this.userService.createUser(data) : of(null)
  });

  private readonly roleIdSignal = toSignal(
    this.userForm.controls.roleId.valueChanges,
    { initialValue: this.userForm.controls.roleId.value }
  );

  public selectedIds = signal<Set<number>>(new Set());
  public generatedPassword = signal('');
  public formStatus = signal('INVALID');

  public currentUserRole = computed(() => this.authService.currentUser?.role ?? '');

  public isCurrentUserSuperAdmin = computed(() => this.currentUserRole() === 'SUPER_ADMIN');

  public availableRoles = computed(() => {
    const roles = this.rolesResource.value() ?? [];
    if (this.isCurrentUserSuperAdmin()) return roles;
    return roles.filter(r => r.code !== 'SUPER_ADMIN');
  });

  public isAdmin = computed(() => {
    const roleId = this.roleIdSignal();
    const roles = this.rolesResource.value() ?? [];
    const selectedRole = roles.find(r => r.id === roleId);
    return selectedRole?.code === 'ADMIN' || selectedRole?.code === 'SUPER_ADMIN';
  });

  public isSuperAdminRole = computed(() => {
    const roleId = this.roleIdSignal();
    const roles = this.rolesResource.value() ?? [];
    return roles.find(r => r.id === roleId)?.code === 'SUPER_ADMIN';
  });

  public isPermissionsLocked = computed(() => this.isSuperAdminRole());

  public filteredMenuOptions = computed(() =>
    (this.menuResource.value() ?? []).filter(item => item.label === 'Panel Principal')
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
    !this.saveResource.isLoading()
  );

  constructor() {
    this.registerEffects();
    this.formStatus.set(this.userForm.status);
    this.userForm.statusChanges.subscribe(status => this.formStatus.set(status));
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
      const res = this.saveResource.value() as any;
      if (res?.temporaryPassword) {
        this.generatedPassword.set(res.temporaryPassword);
        this.toast.success('¡Usuario registrado con éxito!');
      }
    });

    effect(() => {
      const error = this.saveResource.error() as any;
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

    const payload = this.buildPayload(this.userForm.getRawValue());
    this.createTrigger.set(payload);
  }

  private buildPayload(rawForm: any): CreateUserPayload {
    const cleanFields = Object.fromEntries(
      Object.entries(rawForm).map(([key, value]) => [
        key, 
        value === null ? undefined : value
      ])
    );

    return {
      ...cleanFields,
      permissions: Array.from(this.selectedIds())
    };
  }

  private handleCreationError(err: any): void {
    const statusCode = Number(err.error?.message?.split(':')[0]) || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const fieldMapping: Record<number, string> = {
      [HTTP_STATUS.EMAIL_ALREADY_EXISTS]: 'email',
      [HTTP_STATUS.DNI_ALREADY_EXISTS]: 'dni'
    };

    const field = fieldMapping[statusCode];
    if (field) {
      this.userForm.get(field)?.setErrors({ alreadyExists: true });
    }

    const errorMessage = ERROR_MAPPING[statusCode] || ERROR_MAPPING[HTTP_STATUS.INTERNAL_SERVER_ERROR];
    this.toast.error(errorMessage);
    this.createTrigger.set(null);
  }

  public close(refresh = false): void {
    this.dialogRef.close(refresh);
  }
}