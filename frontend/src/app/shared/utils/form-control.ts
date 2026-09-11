import { FormControl, FormGroup, ValidatorFn } from '@angular/forms';

export function createFormControl<T>(initialValue: T, ...validators: ValidatorFn[]): FormControl<T> {
  return new FormControl<T>(initialValue, {
    nonNullable: true,
    validators: validators.length > 0 ? validators : null,
  });
}

export function setControlEnabled(group: FormGroup, key: string, enabled: boolean): void {
  const control = group.get(key);
  if (!control) return;
  if (enabled) {
    control.enable({ emitEvent: false });
  } else {
    control.disable({ emitEvent: false });
  }
}
