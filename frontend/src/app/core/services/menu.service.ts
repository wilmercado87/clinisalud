import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MenuOption } from '@core/models/user.model';
import { environment } from '@env/environment';
import { Observable, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private readonly http = inject(HttpClient);
  private menuCache$?: Observable<MenuOption[]>;

  getMenuOptions(): Observable<MenuOption[]> {
    this.menuCache$ ??= this.http.get<MenuOption[]>(`${environment.apiUrl}/menu-options`).pipe(shareReplay(1));
    return this.menuCache$;
  }

  clearMenuCache(): void {
    this.menuCache$ = undefined;
  }
}
