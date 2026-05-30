import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

import { MatDialog } from '@angular/material/dialog';

import { AuthService } from '../../core/services/auth.service';
import { ConfigService } from '../../core/services/config.service';
import { MaterialModule } from '../../shared/material/material.module';
import { SidebarMenuComponent } from './components/sidebar-menu/sidebar-menu.component';
import { ProfileDialogComponent } from './components/profile-dialog/profile-dialog.component';
import { NotificationBellComponent } from './components/notification-bell/notification-bell.component';
import { MenuOption } from '../../models/auth.model';
import { ROLE_CODES } from '../../core/utils/role-constants';

export interface MenuOptionUI extends MenuOption {
  isOpen?: boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, MaterialModule, SidebarMenuComponent, NotificationBellComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  public readonly configService = inject(ConfigService);

  public isSidebarExpanded = signal(true);

  public currentUser = signal(this.authService.currentUser);

  private readonly rawMenu = toSignal(this.authService.userMenu$, { initialValue: [] as MenuOption[] });

  public menuItems = computed<MenuOptionUI[]>(() =>
    this.rawMenu().map(group => ({ ...group, isOpen: false }))
  );

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

  public isWelcomePage = computed(() => this.currentUrl() === '/dashboard/home');

  public isAdmin = computed(() => {
    const role = this.currentUser()?.role;
    return role === ROLE_CODES.SUPER_ADMIN || role === ROLE_CODES.ADMIN;
  });

  public toggleSidebar(): void {
    this.isSidebarExpanded.update(val => !val);
  }

  public handleLogout(): void {
    this.authService.logout();
  }

  public openProfileDialog(): void {
    this.dialog.open(ProfileDialogComponent, {
      width: '550px',
      disableClose: true,
    });
  }

  public toggleMainPanel(group: MenuOptionUI): void {
    group.isOpen = !group.isOpen;
  }
}