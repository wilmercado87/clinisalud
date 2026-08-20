import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RoleResponse } from '@core/models/user.model';
import { environment } from '@env/environment';
import { Observable, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/roles`;

  private rolesCache$?: Observable<RoleResponse[]>;

  getRoles(): Observable<RoleResponse[]> {
    this.rolesCache$ ??= this.http.get<RoleResponse[]>(this.apiUrl).pipe(shareReplay(1));

    return this.rolesCache$;
  }

  clearCache(): void {
    this.rolesCache$ = undefined;
  }
}
