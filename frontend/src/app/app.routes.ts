import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('@features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('@layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard],
    loadChildren: () => import('@features/dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
