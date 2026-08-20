import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('@features/auth/pages/login/login.component').then((m) => m.LoginComponent),
  },
];
