import { FormControl, ValidatorFn } from '@angular/forms';

export function createFormControl<T>(initialValue: T, ...validators: ValidatorFn[]): FormControl<T> {
  return new FormControl<T>(initialValue, {
    nonNullable: true,
    validators: validators.length > 0 ? validators : null,
  });
}
