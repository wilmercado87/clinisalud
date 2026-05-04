import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private snackBar = inject(MatSnackBar);

  private readonly defaultConfig: MatSnackBarConfig = {
    duration: 4000,
    horizontalPosition: 'end',
    verticalPosition: 'top',
  };

  success(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      ...this.defaultConfig,
      panelClass: ['toast-custom', 'toast-custom--success']
    });
  }

  error(message: string) {
    this.snackBar.open(message, 'Entendido', {
      ...this.defaultConfig,
      panelClass: ['toast-custom', 'toast-custom--error']
    });
  }
}