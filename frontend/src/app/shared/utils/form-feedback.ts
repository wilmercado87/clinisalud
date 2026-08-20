import { Signal, signal } from '@angular/core';

export type FormFeedbackType = 'success' | 'error' | 'info';

export interface FormFeedback {
  type: FormFeedbackType;
  message: string;
}

export interface FormFeedbackController {
  readonly signal: Signal<FormFeedback | null>;
  set(type: FormFeedbackType, message: string): void;
  clear(): void;
}

export function createFormFeedback(): FormFeedbackController {
  const feedback = signal<FormFeedback | null>(null);
  return {
    signal: feedback.asReadonly(),
    set: (type, message) => feedback.set({ type, message }),
    clear: () => feedback.set(null),
  };
}
