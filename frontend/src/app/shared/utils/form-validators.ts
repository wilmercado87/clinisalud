import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const PHONE_PATTERN = /^[+0-9][0-9\s-]{6,14}$/;
export const NUMERIC_PATTERN = /^[0-9]+$/;
export const DISABILITY_PATTERN = /^(SÍ|SI|NO)$/i;

export function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;
  return PHONE_PATTERN.test(String(value).trim()) ? null : { invalidPhone: true };
}

export function numericValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;
  return NUMERIC_PATTERN.test(String(value).trim()) ? null : { invalidNumeric: true };
}

export function ageValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;
  const age = Number(value);
  return Number.isInteger(age) && age >= 0 && age <= 120 ? null : { invalidAge: true };
}

export function disabilityValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;
  return DISABILITY_PATTERN.test(String(value).trim()) ? null : { invalidDisability: true };
}

export function maxDateValidator(maxDate: Date): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return null;
    const max = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
    return date.getTime() > max.getTime() ? { dateInFuture: true } : null;
  };
}

export function toIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDateString(value: string): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return isNaN(date.getTime()) ? null : date;
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
