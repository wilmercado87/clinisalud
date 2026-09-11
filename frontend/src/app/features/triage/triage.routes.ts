import { Routes } from '@angular/router';

export const triageRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@features/triage/pages/triage-form/triage-form.component').then((m) => m.TriageFormComponent),
  },
];
