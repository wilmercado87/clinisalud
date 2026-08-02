import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '@env/environment';
import { MenuOption } from '@core/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private readonly http = inject(HttpClient);
  private menuCache$?: Observable<MenuOption[]>;

  getMenuOptions(): Observable<MenuOption[]> {
    this.menuCache$ ??= this.http
        .get<MenuOption[]>(`${environment.apiUrl}/menu-options`)
        .pipe(shareReplay(1));
    return this.menuCache$;
  }

  clearMenuCache(): void {
    this.menuCache$ = undefined;
  }
}
