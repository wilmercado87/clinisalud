import { Component, inject, ViewChild, signal, effect, AfterViewInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { UserStore } from '@features/dashboard/store/user-store/user.store';
import { UserUI, toUserUI } from '@features/dashboard/utils/user.mapper';
import { ROLE_CODES } from '@shared/utils/role-constants';
import { PAGINATION } from '@shared/utils/pagination-constants';
import { ApiError } from '@shared/utils/status.codes';
import { UserFormDialogComponent } from '@features/dashboard/components/user-form-dialog/user-form-dialog.component';
import { PermissionsDialogComponent } from '@features/dashboard/components/permissions-dialog/permissions-dialog.component';
import { ToastService } from '@core/services/toast.service';
import { createTableUtils } from '@shared/utils/table-utils';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-manager-users',
  imports: [CommonModule, MatPaginatorModule, MatSortModule, MatTableModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, MatMenuModule, MatProgressSpinnerModule, MatTooltipModule, EmptyStateComponent],
  templateUrl: './manager-users.component.html',
  styleUrl: './manager-users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerUsersComponent implements AfterViewInit {
  private readonly userStore = inject(UserStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  public readonly PAGE_SIZE_OPTIONS = PAGINATION.PAGE_SIZE_OPTIONS;
  public readonly displayedColumns: string[] = ['name', 'dni', 'email', 'role', 'status', 'actions'];
  public readonly isLoadingUsers = this.userStore.isLoadingUsers;
  public readonly isToggling = this.userStore.isToggling;

  public readonly usersTable = createTableUtils<UserUI>(this.filterPredicate);
  public togglingUserId = signal<number | null>(null);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.userStore.loadUsers();

    effect(() => {
      const users = this.userStore.users();
      if (users) this.usersTable.setData(users.map(toUserUI));
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

  public isSuperAdmin(user: UserUI): boolean {
    return user.roleCode === ROLE_CODES.SUPER_ADMIN;
  }

  public toggleUserStatus(user: UserUI): void {
    if (!this.isToggling()) {
      this.togglingUserId.set(user.id);
      this.userStore.toggleStatus(user.id);
    }
  }

  public openCreateDialog(): void {
    this.dialog.open(UserFormDialogComponent, { width: '820px', disableClose: true })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => result && this.userStore.loadUsers());
  }

  public openPermissionsDialog(user: UserUI): void {
    this.userStore.resetUpdatePermissions();
    this.dialog.open(PermissionsDialogComponent, { width: '600px', disableClose: true, data: { user: user.source } })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => result?.success && this.userStore.loadUsers());
  }

  private filterPredicate(data: UserUI, filter: string): boolean {
    const searchTerms = [
      data.fullName,
      data.dni,
      data.email,
      data.roleName,
      data.isActiveLabel.toLowerCase(),
    ].join(' ').toLowerCase();

    return filter
      .trim()
      .split(/\s+/)
      .every(term => searchTerms.includes(term.toLowerCase()));
  }
}
