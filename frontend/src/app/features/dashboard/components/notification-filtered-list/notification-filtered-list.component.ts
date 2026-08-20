import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationResponse, NotificationsListData, NotificationsListEvent } from '@core/models/notification.model';
import { createNotificationFilter } from '@shared/utils/notification-filter-utils';

@Component({
  selector: 'app-notification-filtered-list',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './notification-filtered-list.component.html',
  styleUrl: './notification-filtered-list.component.scss',
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
