import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MaterialModule } from '../../../material/material.module';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/roles.services';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Role } from '../../../models/user-manager.model';
import { MenuOption } from '../../../models/auth.model';
import { ERROR_MAPPING } from '../../../utils/status.codes';

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './user-form-dialog.component.html',
  styleUrls: ['./user-form-dialog.component.scss'],
})
export class UserFormDialogComponent implements OnInit {
  // Inyecciones
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  private destroyRef = inject(DestroyRef);
  private snackBar = inject(MatSnackBar);

  // Propiedades de Datos
  public userForm: FormGroup;
  public roles$!: Observable<Role[]>;
  private rolesList: Role[] = [];
  public filteredMenuOptions: MenuOption[] = [];
  public selectedMenuIds: number[] = [];

  // Propiedades de Estado (Reactividad para el Template)
  public isLoading = false;
  public isFullAccessDenied = false;
  public canSubmit = false;
  public generatedPassword = '';
  private totalOptionsCount = 0;

  constructor() {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern('^[0-9]{7,10}$')]],
      address: [''],
      roleId: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadMasterMenu();
    this.listenFormChanges();
  }

  private loadRoles(): void {
    this.roles$ = this.roleService.getRoles();
    this.roles$.subscribe((roles) => {
      this.rolesList = roles;
      this.validateFormState();
    });
  }

  private loadMasterMenu(): void {
    this.roleService
      .getMenuOptions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((menu) => {
        this.filteredMenuOptions = menu.filter(
          (item) => item.label.toUpperCase() === 'PANEL PRINCIPAL',
        );
        this.calculateTotalOptions();
        this.validateFormState();
      });
  }

  private listenFormChanges(): void {
    this.userForm
      .get('roleId')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((roleId) => this.handleRoleChange(roleId));

    this.userForm.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.validateFormState());
  }

  private handleRoleChange(roleId: number): void {
    if (this.isRoleAdmin(roleId)) {
      this.selectAllPermissions();
      return;
    }

    this.selectedMenuIds = [];
    this.validateFormState
  }

  private isRoleAdmin(roleId: number): boolean {
    const role = this.rolesList.find((r) => r.id === roleId);
    return role?.code === 'ADMIN';
  }

  private validateFormState(): void {
    const selectedRoleId = this.userForm.get('roleId')?.value;
    const isAdmin = this.isRoleAdmin(selectedRoleId);

    const hasFullAccess = this.selectedMenuIds.length >= this.totalOptionsCount;
    this.isFullAccessDenied = !isAdmin && hasFullAccess && this.totalOptionsCount > 0;

    this.updateSubmissionStatus();
  }

  private updateSubmissionStatus(): void {
    const isFormValid = this.userForm.valid;
    const hasPermissions = this.selectedMenuIds.length > 0;

    this.canSubmit = isFormValid && hasPermissions && !this.isFullAccessDenied && !this.isLoading;
  }

  private calculateTotalOptions(): void {
    this.totalOptionsCount = this.filteredMenuOptions.reduce(
      (acc, group) => acc + 1 + (group.children?.length || 0), 
      0
    );
  }

  public toggleParent(group: any, isChecked: boolean): void {
    const childIds = group.children?.map((c: any) => c.id) || [];

    if (!isChecked) {
      this.selectedMenuIds = this.selectedMenuIds.filter(
        (id) => id !== group.id && !childIds.includes(id)
      );
    } else {
      this.selectedMenuIds = [...new Set([...this.selectedMenuIds, group.id, ...childIds])];
    }

    this.validateFormState();
  }

  public toggleChild(childId: number, parent: any): void {
    const isSelected = this.selectedMenuIds.includes(childId);

    if (isSelected) {
      this.selectedMenuIds = this.selectedMenuIds.filter(id => id !== childId);
    } else {
      this.selectedMenuIds = [...new Set([...this.selectedMenuIds, childId, parent.id])];
    }

    this.validateFormState();
  }

  public selectAllPermissions(): void {
    this.selectedMenuIds = this.filteredMenuOptions.flatMap(group => [
      group.id,
      ...(group.children?.map((c: any) => c.id) || [])
    ]);

    this.validateFormState();
  }

  public isChecked(id: number): boolean {
    return this.selectedMenuIds.includes(id);
  }

  public onSubmit(): void {
    if (!this.canSubmit) return;

    this.isLoading = true;
    this.validateFormState();

    this.userService
      .createUser({
        ...this.userForm.value,
        permissions: this.selectedMenuIds,
      })
      .subscribe({
        next: (res) => this.handleSuccess(res),
        error: (err) => this.handleError(err),
      });
  }

  private handleSuccess(res: any): void {
    this.isLoading = false;
    this.generatedPassword = res.temporaryPassword;
    this.showSnackBar('¡Usuario registrado con éxito!');
  }

  private handleError(err: any): void {
    debugger;
    this.isLoading = false;
    const errorCode = err.error?.message.split(':')[0] || '500';
    const fieldMapping: Record<string, string> = {
      '405': 'email',
      '406': 'dni',
    };
    const field = fieldMapping[errorCode];
    if (field) this.userForm.get(field)?.setErrors({ alreadyExists: true });

    const message = ERROR_MAPPING[errorCode] || ERROR_MAPPING[500];
    this.showSnackBar(message, true);
    this.validateFormState();
  }

  private showSnackBar(message: string, isError = false): void {
    this.snackBar.open(message, isError ? 'Entendido' : 'Cerrar', {
      duration: isError ? 5000 : 3000,
      panelClass: isError ? ['toast-custom', 'toast-custom--error'] : [],
    });
  }

  public endDialog(): void {
    this.close(true);
  }

  public close(refresh = false): void {
    this.dialogRef.close(refresh);
  }
}
