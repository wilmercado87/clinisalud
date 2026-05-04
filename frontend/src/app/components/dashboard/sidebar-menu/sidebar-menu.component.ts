import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material/material.module';
import { Observable } from 'rxjs';
import { MenuOptionUI } from '../dashboard.component';

@Component({
  selector: 'app-sidebar-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './sidebar-menu.component.html',
  styleUrls: ['./sidebar-menu.component.scss']
})
export class SidebarMenuComponent {
  @Input() menuItems: MenuOptionUI[] | null = [];

  toggleGroup(group: any): void {
    group.isOpen = !group.isOpen;
  }
}