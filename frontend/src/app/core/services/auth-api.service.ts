import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthResponse, LoginRequest } from '@core/models/auth.model';
import { environment } from '@env/environment';
import { UserResponse } from '@core/models/user-manager.model';
import { ERROR_MAPPING, HTTP_STATUS } from '@shared/utils/status.codes';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  public login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  public updateProfile(data: Partial<{ firstName: string; lastName: string; phone: string; address: string }>): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.apiUrl}/profile`, data).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const businessMessage = this.getErrorValidation(error);
    return throwError(() => businessMessage);
  }

  private getErrorValidation(error: HttpErrorResponse): string {
    const { status, error: body } = error;

    if (status === HTTP_STATUS.VALIDATION_ERROR) {
      const detail = body?.errors?.[0]?.message;
      if (detail) return detail;
    }

    return ERROR_MAPPING[status] || body?.message || 'Error inesperado en el servidor';
  }
}
