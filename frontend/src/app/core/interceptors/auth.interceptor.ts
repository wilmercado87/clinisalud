import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from '@core/stores/auth-store/auth.store';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const token = authStore.getToken();
  const currentUser = authStore.currentUser();
  const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/forgot-password');

  if (token && currentUser && !currentUser.isActive && !isAuthEndpoint) {
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
      const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/forgot-password');
      if ((error.status === 401 || error.status === 403) && !isAuthEndpoint) {
        authStore.logout();
      }
      return throwError(() => error);
    }),
  );
};
