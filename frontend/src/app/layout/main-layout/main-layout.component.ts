import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map } from 'rxjs';

import { AuthStore } from '@core/stores/auth-store/auth.store';
import { ConfigStore } from '@core/stores/config-store/config.store';
import { UiStore } from '@core/stores/ui-store/ui.store';
import { NotificationBellComponent } from '@layout/header/notification-bell/notification-bell.component';
import { ProfileDialogComponent } from '@layout/header/profile-dialog/profile-dialog.component';
import { SidebarMenuComponent } from '@layout/sidebar/sidebar-menu.component';
import { ROLE_CODES } from '@shared/utils/role-constants';

@Component({
  selector: 'app-main-layout',
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatListModule,
    SidebarMenuComponent,
    NotificationBellComponent,
  ],
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

  public menuItems = computed(() => this.authStore.menu());

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
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
