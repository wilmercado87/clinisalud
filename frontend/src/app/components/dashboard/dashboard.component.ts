import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { ConfigService } from '../../services/config.service';
import { MaterialModule } from '../../material/material.module';
import { SidebarMenuComponent } from './sidebar-menu/sidebar-menu.component';
import { MenuOption } from '../../models/auth.model';

export interface MenuOptionUI extends MenuOption {
  isOpen?: boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, MaterialModule, SidebarMenuComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  public readonly configService = inject(ConfigService);

  public isSidebarExpanded = signal(true);

  public currentUser = signal(this.authService.currentUser);

  private rawMenu = toSignal(this.authService.userMenu$, { initialValue: [] as MenuOption[] });

  public menuItems = computed<MenuOptionUI[]>(() =>
    this.rawMenu().map(group => ({ ...group, isOpen: false }))
  );

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

  public isWelcomePage = computed(() => this.currentUrl() === '/dashboard/home');

  public toggleSidebar(): void {
    this.isSidebarExpanded.update(val => !val);
  }

  public handleLogout(): void {
    this.authService.logout();
  }

  public toggleMainPanel(group: MenuOptionUI): void {
    group.isOpen = !group.isOpen;
  }
}