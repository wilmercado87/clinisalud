import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('@features/dashboard/pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('@features/dashboard/pages/manager-users/manager-users.component').then((m) => m.ManagerUsersComponent),
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('@features/dashboard/pages/notifications/notifications.component').then((m) => m.NotificationsComponent),
  },
  {
    path: 'admission',
    loadChildren: () => import('@features/admissions/admissions.routes').then((m) => m.admissionsRoutes),
  },
  {
    path: 'authorizations',
    loadComponent: () =>
      import('@features/admissions/pages/authorization-manager/authorization-manager.component').then(
        (m) => m.AuthorizationManagerComponent,
      ),
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];
