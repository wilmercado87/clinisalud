import { Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, map } from 'rxjs';

export interface TrackableForm<TValue> {
  status: string;
  statusChanges: Observable<string>;
  getRawValue(): TValue;
  valueChanges: Observable<Partial<TValue>>;
}

export interface FormTrackSignals<TValue> {
  status: Signal<string>;
  value: Signal<Partial<TValue>>;
}

export function trackFormSignals<TValue>(form: TrackableForm<TValue>): FormTrackSignals<TValue> {
  return {
    status: toSignal(form.statusChanges, { initialValue: form.status }),
    value: toSignal(form.valueChanges.pipe(map(() => form.getRawValue())), { initialValue: form.getRawValue() }),
  };
}
