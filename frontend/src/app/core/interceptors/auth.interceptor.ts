import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '@core/stores/auth-store/auth.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const token = authStore.getToken();
  const currentUser = authStore.currentUser();

  if (token && currentUser && !currentUser.isActive && !req.url.includes('/auth/login')) {
    authStore.logout();
    return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Usuario inactivo' }));
  }

  let cloned = req;
  if (token) {
    cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        authStore.logout();
      }
      return throwError(() => error);
    }),
  );
};
