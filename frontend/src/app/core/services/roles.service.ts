import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '@env/environment';
import { RoleResponse } from '@core/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/roles`;

  private rolesCache$?: Observable<RoleResponse[]>;

  getRoles(): Observable<RoleResponse[]> {
    this.rolesCache$ ??= this.http
        .get<RoleResponse[]>(this.apiUrl)
        .pipe(shareReplay(1));

    return this.rolesCache$;
  }

  clearCache(): void {
    this.rolesCache$ = undefined;
  }
}
