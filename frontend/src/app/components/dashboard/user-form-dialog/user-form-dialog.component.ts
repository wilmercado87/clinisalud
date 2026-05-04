import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { MaterialModule } from '../../../material/material.module';
import { Role } from '../../../models/user-manager.model';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { MenuOption } from '../../../models/auth.model';
import { RoleService } from '../../../services/roles.services';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ERROR_MAPPING } from '../../../utils/status.codes';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './user-form-dialog.component.html',
  styleUrls: ['./user-form-dialog.component.scss'],
})
export class UserFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  private destroyRef = inject(DestroyRef);
  private snackBar = inject(MatSnackBar);

  public userForm: FormGroup;
  public roles$!: Observable<Role[]>;
  private rolesList: Role[] = [];
  public filteredMenuOptions: MenuOption[] = [];
  public selectedMenuIds: number[] = [];
  public isLoading = false;
  public generatedPassword = '';

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
    this.loadMenuFromSession();
    this.listenRoleChanges();
  }

  private loadRoles(): void {
    this.roles$ = this.roleService.getRoles();
    this.roles$.subscribe((roles) => (this.rolesList = roles));
  }

  private loadMenuFromSession(): void {
    this.authService.userMenu$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((menu) => {
        this.filteredMenuOptions = menu.filter(
          (item) => item.label.toUpperCase() === 'PANEL PRINCIPAL'
        );

        this.checkAdminPrivileges();
      });
  }

  private listenRoleChanges(): void {
    this.userForm.get('roleId')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(roleId => {
        this.checkAdminPrivileges(roleId);
      });
  }

  private checkAdminPrivileges(selectedRoleId?: number): void {
    const id = selectedRoleId || this.userForm.get('roleId')?.value;
    const selectedRole = this.rolesList.find(r => r.id === id);
    if (selectedRole?.code === 'ADMIN') {
      this.selectAllPermissions();
      return;
    }
      this.selectedMenuIds = [];
  }

  private selectAllPermissions(): void {
    const allIds: number[] = [];
    this.filteredMenuOptions.forEach(group => {
      allIds.push(group.id);
      if (group.children) {
        group.children.forEach((child: any) => allIds.push(child.id));
      }
    });
    this.selectedMenuIds = [...new Set(allIds)];
  }

  public toggleParent(group: any, isChecked: boolean): void {
    const childIds = group.children.map((c: any) => c.id);
    if (isChecked) {
      this.selectedMenuIds = Array.from(
        new Set([...this.selectedMenuIds, group.id, ...childIds]),
      );
    } else {
      this.selectedMenuIds = this.selectedMenuIds.filter(
        (id) => id !== group.id && !childIds.includes(id),
      );
    }
  }

  public toggleChild(childId: number, parent: any): void {
    const index = this.selectedMenuIds.indexOf(childId);
    if (index > -1) {
      this.selectedMenuIds.splice(index, 1);
      this.selectedMenuIds = this.selectedMenuIds.filter(
        (id) => id !== parent.id,
      );
    } else {
      this.selectedMenuIds.push(childId);
    }
  }

  public isChecked(id: number): boolean {
    return this.selectedMenuIds.includes(id);
  }

  public onSubmit(): void {
  if (this.userForm.invalid || this.selectedMenuIds.length === 0) return;

  this.isLoading = true;

  this.userService
    .createUser({ ...this.userForm.value, permissions: this.selectedMenuIds })
    .subscribe({
      next: (res) => {
        this.isLoading = false;
        this.generatedPassword = res.temporaryPassword;
        this.snackBar.open('¡Usuario registrado con éxito!', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.isLoading = false;
        const errorCode = err.error?.message;
        const message = ERROR_MAPPING[errorCode] || ERROR_MAPPING[500];

        if (errorCode === '405') {
    this.userForm.get('email')?.setErrors({ alreadyExists: true });
  }
  if (errorCode === '406') {
    this.userForm.get('dni')?.setErrors({ alreadyExists: true });
  }

        this.snackBar.open(message, 'Entendido', {
          duration: 5000,
          panelClass: ['toast-custom', 'toast-custom--error']
        });
      },
    });
}

  public endDialog(): void {
    this.close(true);
  }

  public close(refresh = false): void {
    this.dialogRef.close(refresh);
  }
}
