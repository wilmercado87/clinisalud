import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'users',
    loadComponent: () => import('./pages/manager-users/manager-users.component').then(m => m.ManagerUsersComponent),
  },
  {
    path: 'notifications',
    loadComponent: () => import('./pages/notifications/notifications.component').then(m => m.NotificationsComponent),
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];
