import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material/material.module';
import { NotificationResponse } from '../../../../core/models/notification-dto.model';
import { NotificationUI, NotificationsListData, NotificationsListEvent } from '../../../../features/dashboard/models/notification.model';
import { createNotificationFilter } from '../../../../shared/utils/notification-filter-utils';

@Component({
  selector: 'app-notification-filtered-list',
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './notification-filtered-list.component.html',
  styleUrls: ['./notification-filtered-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationFilteredListComponent {
  public readonly data = input.required<NotificationsListData>();
  public readonly event = output<NotificationsListEvent>();

  public readonly filter = createNotificationFilter(computed(() => this.data().notifications));

  public onCardClick(targetNotification: NotificationResponse): void {
    this.event.emit({ type: 'markAsRead', notification: targetNotification });
  }
}
