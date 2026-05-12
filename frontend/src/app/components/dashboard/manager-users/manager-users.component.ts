import { Component, inject, ViewChild, signal, computed, effect, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { rxResource } from '@angular/core/rxjs-interop';

import { MaterialModule } from '../../../material/material.module';
import { UserService } from '../../../services/user.service';
import { ToggleStatusResponse, User } from '../../../models/user-manager.model';
import { SharedModule } from '../../../shared/shared.module';
import { UserFormDialogComponent } from '../user-form-dialog/user-form-dialog.component';
import { PermissionsDialogComponent } from '../permissions-dialog/permissions-dialog.component';
import { ToastService } from '../../../services/toast.service';
import { of } from 'rxjs';

@Component({
  selector: 'app-manager-users',
  imports: [CommonModule, MaterialModule, SharedModule],
  templateUrl: './manager-users.component.html',
  styleUrls: ['./manager-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagerUsersComponent implements AfterViewInit {
  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  public usersResource = rxResource({
    loader: () => this.userService.getManageableUsers()
  });

  public toggleUserIdTrigger = signal<number | null>(null);

  public toggleStatusResource = rxResource<ToggleStatusResponse | undefined, number | null>({
    request: () => this.toggleUserIdTrigger(),
    loader: ({ request: id }) => {
      if (id === null) {
        return of(undefined);
      }

      return this.userService.toggleStatus(id);
    }
  });

  public filterValue = signal('');
  public dataSource = new MatTableDataSource<User>([]);
  public displayedColumns: string[] = ['name', 'dni', 'email', 'role', 'status', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    effect(() => {
      const users = this.usersResource.value();
      if (users) {
        this.dataSource.data = users;
        this.dataSource.filterPredicate = this.createFilterPredicate();
      }
    });

    effect(() => {
      const result = this.toggleStatusResource.value();
      if (result && 'message' in result) {
        this.toast.success(result.message);
        this.usersResource.reload();
        this.toggleUserIdTrigger.set(null);
      }
    });

    effect(() => {
      if (this.usersResource.error()) {
        this.toast.error('Error al sincronizar datos del servidor');
      }

      const toggleErr = this.toggleStatusResource.error() as any;
      if (toggleErr) {
        this.toast.error(toggleErr.error?.message?.split(':')[1] || 'Error al cambiar estado');
        this.toggleUserIdTrigger.set(null);
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private createFilterPredicate(): (data: User, filter: string) => boolean {
    return (data: User, filter: string): boolean => {
      const searchTerms = [
        data.firstName, data.lastName, data.dni, data.email,
        data.roleData?.name, data.isActive ? 'activo' : 'inactivo'
      ].join(' ').toLowerCase();
      return searchTerms.includes(filter.trim().toLowerCase());
    };
  }

  public applyFilter(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.filterValue.set(val);
    this.dataSource.filter = val;
    this.paginator?.firstPage();
  }

  public toggleUserStatus(user: User): void {
    if (!this.toggleStatusResource.isLoading()) {
      this.toggleUserIdTrigger.set(user.id);
    }
  }

  public openCreateDialog(): void {
    this.dialog.open(UserFormDialogComponent, { width: '700px', disableClose: true })
      .afterClosed()
      .subscribe(result => result && this.usersResource.reload());
  }

  public openPermissionsDialog(user: User): void {
    this.dialog.open(PermissionsDialogComponent, { width: '600px', disableClose: true, data: { user } })
      .afterClosed()
      .subscribe(result => result?.success && this.usersResource.reload());
  }
}