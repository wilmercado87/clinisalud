import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmptyStateComponent } from '../components/empty-state/empty-state.component';

@NgModule({
  declarations: [EmptyStateComponent],
  imports: [CommonModule],
  exports: [EmptyStateComponent, CommonModule],
})
export class SharedModule {}
