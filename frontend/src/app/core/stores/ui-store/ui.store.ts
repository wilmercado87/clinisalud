import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiStore {
  public readonly isSidebarExpanded = signal(true);

  public toggleSidebar(): void {
    this.isSidebarExpanded.update((val) => !val);
  }
}
