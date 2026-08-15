import { Pipe, PipeTransform } from '@angular/core';
import { ADMISSION_STATES, AdmissionState } from '@features/admissions/models/admissions.model';

export interface AdmissionStateView {
  label: string;
  tone: string;
}

const STATE_VIEWS: Record<AdmissionState, AdmissionStateView> = {
  [ADMISSION_STATES.REGISTERED]: { label: 'Registrada', tone: 'registered' },
  [ADMISSION_STATES.IN_CARE]: { label: 'En Atención', tone: 'in-care' },
  [ADMISSION_STATES.WITH_EPICRISIS]: { label: 'En Epicrisis', tone: 'epicrisis' },
  [ADMISSION_STATES.BILLED]: { label: 'Facturada', tone: 'billed' },
  [ADMISSION_STATES.DISCHARGED]: { label: 'Egresada', tone: 'discharged' },
};

const DEFAULT_VIEW: AdmissionStateView = { label: '', tone: 'default' };

export function admissionStateLabel(state: string): string {
  const view = STATE_VIEWS[state as AdmissionState];
  return view?.label ?? state;
}

@Pipe({
  name: 'admissionState',
  standalone: true,
})
export class AdmissionStatePipe implements PipeTransform {
  transform(state: string): AdmissionStateView {
    const view = STATE_VIEWS[state as AdmissionState];
    if (!view) return { ...DEFAULT_VIEW, label: state };
    return view;
  }
}