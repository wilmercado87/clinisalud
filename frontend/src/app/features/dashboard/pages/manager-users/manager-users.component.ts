import { Component, inject, ViewChild, signal, effect, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';

import { MaterialModule } from '../../../../shared/material/material.module';
import { UserStore } from '../../store/user-store/user.store';
import { UserResponse } from '../../../../core/models/user-manager.model';
import { ROLE_CODES } from '../../../../shared/utils/role-constants';
import { PAGINATION } from '../../../../shared/utils/pagination-constants';
import { ApiError } from '../../../../shared/utils/status.codes';
import { SharedModule } from '../../../../shared/shared.module';
import { UserFormDialogComponent } from '../../components/user-form-dialog/user-form-dialog.component';
import { PermissionsDialogComponent } from '../../components/permissions-dialog/permissions-dialog.component';
import { ToastService } from '../../../../core/services/toast.service';
import { createTableUtils } from '../../../../shared/utils/table-utils';

@Component({
  selector: 'app-manager-users',
  imports: [CommonModule, MaterialModule, SharedModule],
  templateUrl: './manager-users.component.html',
  styleUrls: ['./manager-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagerUsersComponent implements AfterViewInit {
  public readonly PAGE_SIZE_OPTIONS = PAGINATION.PAGE_SIZE_OPTIONS;
  private readonly userStore = inject(UserStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  private readonly filterPredicate = (data: UserResponse, filter: string): boolean => {
  const searchTerms = [
    data.firstName, 
    data.lastName, 
    data.dni, 
    data.email,
    data.roleData?.name, 
    data.isActive ? 'activo' : 'inactivo'
  ].join(' ').toLowerCase();

  return filter
    .trim()
    .split(/\s+/)
    .every(term => searchTerms.includes(term.toLowerCase()));
};

  public readonly usersTable = createTableUtils<UserResponse>(this.filterPredicate);

  public readonly displayedColumns: string[] = ['name', 'dni', 'email', 'role', 'status', 'actions'];

  public readonly isLoadingUsers = this.userStore.isLoadingUsers;
  public readonly isToggling = this.userStore.isToggling;

  public togglingUserId = signal<number | null>(null);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  public isSuperAdmin(user: UserResponse): boolean {
    return user.roleData?.code === ROLE_CODES.SUPER_ADMIN;
  }

  constructor() {
    effect(() => {
      const users = this.userStore.users();
      if (users) this.usersTable.setData(users);
    });

    effect(() => {
      const result = this.userStore.toggleResult();
      if (result && 'message' in result) {
        this.toast.success(result.message);
        this.userStore.loadUsers();
        this.togglingUserId.set(null);
      }
    });

    effect(() => {
      if (this.userStore.usersError()) {
        this.toast.error('Error al sincronizar datos del servidor');
      }

      const toggleErr = this.userStore.toggleError() as ApiError;
      if (toggleErr) {
        this.toast.error(toggleErr.error?.message || 'Error al cambiar estado');
        this.togglingUserId.set(null);
      }
    });
  }

  ngAfterViewInit(): void {
    this.usersTable.connectPaginatorSort(this.paginator, this.sort);
  }

  public toggleUserStatus(user: UserResponse): void {
    if (!this.isToggling()) {
      this.togglingUserId.set(user.id);
      this.userStore.toggleStatus(user.id);
    }
  }

  public openCreateDialog(): void {
    this.dialog.open(UserFormDialogComponent, { width: '700px', disableClose: true })
      .afterClosed()
      .subscribe(result => result && this.userStore.loadUsers());
  }

  public openPermissionsDialog(user: UserResponse): void {
    this.dialog.open(PermissionsDialogComponent, { width: '600px', disableClose: true, data: { user } })
      .afterClosed()
      .subscribe(result => result?.success && this.userStore.loadUsers());
  }
}