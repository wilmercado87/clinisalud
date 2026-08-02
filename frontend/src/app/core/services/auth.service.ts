import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthResponse, LoginRequest } from '@core/models/auth.model';
import { environment } from '@env/environment';
import { UserResponse } from '@core/models/user.model';
import { getBusinessErrorMessage } from '@shared/utils/http-error';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  public login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  public forgotPassword(email: string): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.apiUrl}/forgot-password`, { email })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  public updateProfile(data: Partial<{ email: string; firstName: string; lastName: string; phone: string; address: string }>): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.apiUrl}/profile`, data).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  public changePassword(data: { currentPassword: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/change-password`, data).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    return throwError(() => getBusinessErrorMessage(error));
  }
}
