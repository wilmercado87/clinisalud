import { FormControl, FormGroup } from '@angular/forms';

export type TriageForm = FormGroup<{
  priorityTypeId: FormControl<number | null>;
  epsId: FormControl<number | null>;
  diagnosticId: FormControl<number | null>;
}>;

export type TriageFormValue = {
  priorityTypeId: number | null;
  epsId: number | null;
  diagnosticId: number | null;
};

export const TRIAGE_ERROR_RULES = {
  priorityTypeId: [['required', 'La prioridad de triage es requerida']],
  epsId: [['required', 'La EPS es requerida']],
  diagnosticId: [['required', 'El diagnóstico CIE-10 es requerido']],
} satisfies Record<string, [string, string][]>;
