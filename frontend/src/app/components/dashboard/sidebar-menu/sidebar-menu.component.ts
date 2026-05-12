import {
  Component,
  input,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material/material.module';
import { MenuOptionUI } from '../dashboard.component';

@Component({
  selector: 'app-sidebar-menu',
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './sidebar-menu.component.html',
  styleUrls: ['./sidebar-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarMenuComponent {
  public menuItems = input<MenuOptionUI[] | null>([]);

  private openGroupIds = signal<Set<number>>(new Set());

  public toggleGroup(groupId: number): void {
    const nextSet = new Set(this.openGroupIds());

    if (nextSet.has(groupId)) {
      nextSet.delete(groupId);
    } else {
      nextSet.add(groupId);
    }

    this.openGroupIds.set(nextSet);
  }

  public isExpanded(groupId: number): boolean {
    return this.openGroupIds().has(groupId);
  }
}
