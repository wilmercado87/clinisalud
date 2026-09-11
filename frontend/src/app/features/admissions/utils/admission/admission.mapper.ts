import { AdmissionAuthorization } from '@shared/models/patient-lookup.model';
import { AuthorizationFormValue } from '@features/admissions/utils/authorization/authorization-form.types';

export function queuedValuesToAuthorizations(values: AuthorizationFormValue[]): AdmissionAuthorization[] {
  return values.map((value) => ({
    authTypeId: value.authTypeId ?? 0,
    authNumber: value.authNumber,
    mapiissCode: value.mapiissCode,
    quantity: value.quantity ?? 1,
    feeScheduleId: value.feeScheduleId ?? 0,
    mapiissDescription: value.mapiissDescription || undefined,
  }));
}
