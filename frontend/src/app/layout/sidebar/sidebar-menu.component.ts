import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { MenuOption } from '@core/models/user.model';

@Component({
  selector: 'app-sidebar-menu',
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './sidebar-menu.component.html',
  styleUrl: './sidebar-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarMenuComponent {
  public menuItems = input<MenuOption[] | null>([]);

  private readonly openGroupIds = signal<Set<number>>(new Set());

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
