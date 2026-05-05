import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmptyStateComponent } from '../components/empty-state/empty-state.component';
import { MaterialModule } from '../material/material.module';

@NgModule({
  declarations: [EmptyStateComponent],
  imports: [CommonModule, MaterialModule],
  exports: [EmptyStateComponent, CommonModule, MaterialModule],
})
export class SharedModule {}
