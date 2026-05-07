import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MaterialModule } from '../../../material/material.module';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user-manager.model';
import { SharedModule } from '../../../shared/shared.module';
import { MatDialog } from '@angular/material/dialog';
import { UserFormDialogComponent } from '../user-form-dialog/user-form-dialog.component';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-manager-users',
  standalone: true,
  imports: [CommonModule, MaterialModule, SharedModule],
  templateUrl: './manager-users.component.html',
  styleUrls: ['./manager-users.component.scss'],
})
export class ManagerUsersComponent implements OnInit {
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);

  public displayedColumns: string[] = [
    'name',
    'dni',
    'email',
    'role',
    'status',
    'actions',
  ];
  public dataSource = new MatTableDataSource<User>([]);
  public isLoading = true;
  public togglingUserId: number | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.isLoading = true;
    this.userService.getManageableUsers().subscribe({
      next: (users) => {
        this.dataSource.data = users;
        this.dataSource.filterPredicate = this.createFilterPredicate();
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
    });
  }

  private createFilterPredicate(): (data: User, filter: string) => boolean {
    return (data: User, filter: string): boolean => {
      const transformedFilter = filter.trim().toLowerCase();

      const searchTerms = [
        data.firstName,
        data.lastName,
        data.dni,
        data.email,
        data.roleData?.name,
        data.isActive ? 'activo' : 'inactivo',
      ]
        .join(' ')
        .toLowerCase();

      return searchTerms.includes(transformedFilter);
    };
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '700px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.fetchUsers();
    });
  }

  openPermissionsDialog(user: User): void {
    this.toast.info(`Gestionando permisos para: ${user.firstName}`);
  }

  toggleUserStatus(user: User): void {
    this.togglingUserId = user.id;
    this.userService.toggleStatus(user.id).subscribe({
      next: (result) => {
        user.isActive = result.isActive;
        this.togglingUserId = null;
        this.toast.success(result.message);
      },
      error: (err) => {
        this.togglingUserId = null;
        const msg = err.error?.message || "No se pudo cambiar el estado";
        this.toast.error(msg);
      }
    });
  }
}
