import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';

import { ConfigStore } from '@core/stores/config-store/config.store';
import { SidebarMenuComponent } from '@layout/sidebar/sidebar-menu.component';
import { ProfileDialogComponent } from '@layout/header/profile-dialog/profile-dialog.component';
import { NotificationBellComponent } from '@layout/header/notification-bell/notification-bell.component';
import { MenuOption } from '@core/models/auth.model';
import { ROLE_CODES } from '@shared/utils/role-constants';
import { AuthStore } from '@core/stores/auth-store/auth.store';
import { UiStore } from '@core/stores/ui-store/ui.store';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterModule, MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule, MatTooltipModule, MatListModule, SidebarMenuComponent, NotificationBellComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  private readonly uiStore = inject(UiStore);
  private readonly dialog = inject(MatDialog);
  public readonly configStore = inject(ConfigStore);

  public readonly config = this.configStore.config;

  public readonly isSidebarExpanded = this.uiStore.isSidebarExpanded;

  public readonly currentUser = this.authStore.currentUser;

  private readonly rawMenu = toSignal(this.authStore.userMenu$, { initialValue: [] as MenuOption[] });

  public menuItems = computed<MenuOption[]>(() =>
    this.rawMenu().map(group => ({ ...group }))
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
    this.uiStore.toggleSidebar();
  }

  public handleLogout(): void {
    this.authStore.logout();
  }

  public openProfileDialog(): void {
    this.dialog.open(ProfileDialogComponent, {
      width: '550px',
      disableClose: true,
    });
  }
}
