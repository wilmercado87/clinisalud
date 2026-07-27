import { Injectable, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { UserService } from '../../services/user.service';
import { UserResponse, ToggleStatusResponse, PermissionOverride } from '../../../../core/models/user-manager.model';

interface CreatePayload {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone?: string;
  address?: string;
  roleId: number;
  permissions: number[];
}

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly userService = inject(UserService);

  private readonly usersResource = rxResource({
    loader: () => this.userService.getManageableUsers(),
  });

  readonly users = this.usersResource.value.asReadonly();
  readonly isLoadingUsers = this.usersResource.isLoading;
  readonly usersError = this.usersResource.error;

  private readonly toggleTrigger = signal<{ id: number } | null>(null);

  private readonly toggleResource = rxResource({
    request: () => this.toggleTrigger(),
    loader: ({ request }) => {
      if (!request) return of(undefined);
      return this.userService.toggleStatus(request.id);
    },
  });

  readonly toggleResult = this.toggleResource.value.asReadonly();
  readonly isToggling = this.toggleResource.isLoading;
  readonly toggleError = this.toggleResource.error;

  private readonly createTrigger = signal<{ data: CreatePayload } | null>(null);

  private readonly createResource = rxResource({
    request: () => this.createTrigger(),
    loader: ({ request }) => {
      if (!request) return of(null);
      return this.userService.createUser(request.data);
    },
  });

  readonly createResult = this.createResource.value.asReadonly();
  readonly isCreating = this.createResource.isLoading;
  readonly createError = this.createResource.error;

  private readonly updatePermissionsTrigger = signal<{ userId: number; overrides: PermissionOverride[] } | null>(null);

  private readonly updatePermissionsResource = rxResource({
    request: () => this.updatePermissionsTrigger(),
    loader: ({ request }) => {
      if (!request) return of(undefined);
      return this.userService.updatePermissions(request.userId, request.overrides);
    },
  });

  readonly updatePermissionsResult = this.updatePermissionsResource.value.asReadonly();
  readonly isUpdatingPermissions = this.updatePermissionsResource.isLoading;
  readonly updatePermissionsError = this.updatePermissionsResource.error;

  loadUsers(): void {
    this.usersResource.reload();
  }

  toggleStatus(id: number): void {
    this.toggleTrigger.set({ id });
  }

  createUser(data: CreatePayload): void {
    this.createTrigger.set({ data });
  }

  updatePermissions(userId: number, overrides: PermissionOverride[]): void {
    this.updatePermissionsTrigger.set({ userId, overrides });
  }
}
