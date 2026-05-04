import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { map, Observable } from 'rxjs';
import { MenuOption } from '../../models/auth.model';
import { MaterialModule } from '../../material/material.module';
import { SidebarMenuComponent } from './sidebar-menu/sidebar-menu.component';
import { ConfigService } from '../../services/config.service';

export interface MenuOptionUI extends MenuOption {
  isOpen?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, SidebarMenuComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  public configService = inject(ConfigService);
  public isSidebarExpanded = true;
  public currentUser = this.authService.currentUser;
  public menu$!: Observable<MenuOptionUI[]>;

  ngOnInit(): void {
    this.listernerMenu();
  }

  listernerMenu(): void {
    this.menu$ = this.authService.userMenu$.pipe(
      map((menu) => menu.map((group) => ({ ...group, isOpen: false }))),
    );
  }

  toggleSidebar(): void {
    this.isSidebarExpanded = !this.isSidebarExpanded;
  }

  handleLogout(): void {
    this.authService.logout();
  }

  toggleMainPanel(group: any): void {
    group.isOpen = !group.isOpen;
  }

  get isWelcomePage(): boolean {
    return this.router.url === '/dashboard/home';
  }
}
