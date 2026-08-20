import { Routes } from '@angular/router';

export const admissionsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@features/admissions/pages/admission-form/admission-form.component').then(
        (m) => m.AdmissionFormComponent,
      ),
  },
  {
    path: 'census',
    loadComponent: () => import('@features/admissions/pages/census/census.component').then((m) => m.CensusComponent),
  },
];
