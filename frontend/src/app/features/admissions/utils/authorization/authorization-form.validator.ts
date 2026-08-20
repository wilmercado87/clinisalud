import { ValidatorFn, Validators } from '@angular/forms';
import { AdmissionAuthorization } from '@features/admissions/models/admissions.model';
import { extractFieldErrors } from '@shared/utils/form-field-errors';
import { numericValidator } from '@shared/utils/form-validators';
import { AUTH_MESSAGES, formatMessage } from '@shared/utils/messages';
import {
  AuthorizationEntryError,
  AuthorizationFormGroup,
  AuthorizationFormValue,
  AuthorizationIdentity,
} from './authorization-form.types';

export const AUTHORIZATION_ERROR_RULES = {
  authTypeId: [['required', 'Seleccione Tipo Autorización']],
  authNumber: [['required', 'N° Autorización requerido']],
  mapiissCode: [['required', 'Seleccione MAPIISS']],
  quantity: [
    ['required', 'Cantidad requerida'],
    ['invalidNumeric', 'Solo números'],
    ['min', 'Mínimo 1'],
    ['max', 'Excede el máximo'],
  ],
} satisfies Record<string, [string, string][]>;

export type AuthorizationKeyCounts = Map<string, number>;

export type AuthorizationEntryViolationKind = 'duplicate-entry' | 'quantity-exceeded';

export interface AuthorizationEntryViolation {
  row: number;
  kind: AuthorizationEntryViolationKind;
  authNumber?: string;
  mapiissCode?: string;
  feeScheduleId?: number | null;
  quantity?: number | null;
  maxQuantity?: number | null;
}

export function formatAuthorizationViolationMessage(violation: AuthorizationEntryViolation): string {
  switch (violation.kind) {
    case 'duplicate-entry':
      return formatMessage(AUTH_MESSAGES.DUPLICATE_AUTH_KEY, {
        authNumber: violation.authNumber ?? '',
        cups: violation.mapiissCode ?? '',
      });
    case 'quantity-exceeded':
      return formatMessage(AUTH_MESSAGES.QUANTITY_EXCEEDS_MAPIISS_MAX, {
        quantity: violation.quantity ?? 0,
        cups: violation.mapiissCode ?? '',
        maxQuantity: violation.maxQuantity ?? 0,
      });
  }
}

export function applyAuthorizationQuantityMax(formGroup: AuthorizationFormGroup, maxQuantity: number | null): void {
  const validators: ValidatorFn[] = [Validators.required, numericValidator, Validators.min(1)];
  if (maxQuantity !== null && maxQuantity > 0) {
    validators.push(Validators.max(maxQuantity));
  }
  formGroup.controls.quantity.setValidators(validators);
  formGroup.controls.quantity.updateValueAndValidity({ emitEvent: false });
}

export function applyAuthorizationCupsSelection(
  formGroup: AuthorizationFormGroup,
  cups: { code: string; description: string; maxQuantity: number },
): void {
  formGroup.patchValue({
    mapiissCode: cups.code,
    description: cups.description,
    maxQuantity: cups.maxQuantity,
  });
  applyAuthorizationQuantityMax(formGroup, cups.maxQuantity);
}

export function clearAuthorizationCupsSelection(formGroup: AuthorizationFormGroup): void {
  formGroup.patchValue({ mapiissCode: '', description: '', maxQuantity: null });
  applyAuthorizationQuantityMax(formGroup, null);
}

export function computeAuthorizationFieldErrors(entries: AuthorizationFormGroup[]): AuthorizationEntryError[] {
  return entries.map((formGroup) => baseEntryErrors(formGroup));
}

export function evaluateAuthorizationEntryRules(
  entries: AuthorizationFormGroup[],
  existingAuthorizations: AdmissionAuthorization[],
  queuedAuthorizations: AuthorizationFormValue[],
): AuthorizationEntryViolation[] {
  const entranceKeyCounts = countKeys(entryKeyOf, entries, existingAuthorizations, queuedAuthorizations);

  const violations: AuthorizationEntryViolation[] = [];
  for (const [row, formGroup] of entries.entries()) {
    const detail = entryRuleDetail(formGroup, entranceKeyCounts, existingAuthorizations, queuedAuthorizations, entries);
    if (detail) violations.push({ row, ...detail });
  }
  return violations;
}

function entryRuleDetail(
  formGroup: AuthorizationFormGroup,
  entranceKeyCounts: AuthorizationKeyCounts,
  existingAuthorizations: AdmissionAuthorization[],
  queuedAuthorizations: AuthorizationFormValue[],
  entries: AuthorizationFormGroup[],
): Omit<AuthorizationEntryViolation, 'row'> | null {
  const duplicateEntry = checkEntryDuplicate(formGroup, entranceKeyCounts);
  if (duplicateEntry) return duplicateEntry;

  return checkAccumulatedQuantity(formGroup, existingAuthorizations, queuedAuthorizations, entries);
}

function baseEntryErrors(formGroup: AuthorizationFormGroup): AuthorizationEntryError {
  const baseErrors = extractFieldErrors(formGroup, AUTHORIZATION_ERROR_RULES);
  const result: AuthorizationEntryError = {};
  for (const [key, value] of Object.entries(baseErrors)) {
    if (value !== null) {
      (result as Record<string, string>)[key] = value;
    }
  }
  return result;
}

function checkEntryDuplicate(
  formGroup: AuthorizationFormGroup,
  keyCounts: AuthorizationKeyCounts,
): Omit<AuthorizationEntryViolation, 'row'> | null {
  const identity = identityFromForm(formGroup);
  const key = entryKeyOf(identity);
  if (!key || (keyCounts.get(key) ?? 0) <= 1) return null;
  return {
    kind: 'duplicate-entry',
    authNumber: identity.authNumber,
    mapiissCode: identity.mapiissCode,
    feeScheduleId: identity.feeScheduleId,
  };
}

function checkAccumulatedQuantity(
  formGroup: AuthorizationFormGroup,
  existingAuthorizations: AdmissionAuthorization[],
  queuedAuthorizations: AuthorizationFormValue[],
  entries: AuthorizationFormGroup[],
): Omit<AuthorizationEntryViolation, 'row'> | null {
  const identity = identityFromForm(formGroup);
  const maxQuantity = formGroup.controls.maxQuantity.value;
  const quantity = formGroup.controls.quantity.value;
  if (!isCompleteService(identity) || maxQuantity === null || maxQuantity <= 0 || quantity === null || quantity <= 0) {
    return null;
  }

  const total = accumulatedQuantityOf(formGroup, identity, existingAuthorizations, queuedAuthorizations, entries);
  if (total <= maxQuantity) return null;
  return { kind: 'quantity-exceeded', mapiissCode: identity.mapiissCode, quantity, maxQuantity };
}

function accumulatedQuantityOf(
  formGroup: AuthorizationFormGroup,
  identity: AuthorizationIdentity,
  existingAuthorizations: AdmissionAuthorization[],
  queuedAuthorizations: AuthorizationFormValue[],
  entries: AuthorizationFormGroup[],
): number {
  let total = formGroup.controls.quantity.value ?? 0;
  for (const authorization of existingAuthorizations) {
    if (belongsToService(authorization, identity)) total += authorization.quantity;
  }
  for (const authorization of queuedAuthorizations) {
    if (belongsToService(authorization, identity)) total += authorization.quantity ?? 1;
  }
  for (const other of entries) {
    if (other === formGroup) continue;
    if (belongsToService(identityFromForm(other), identity)) {
      total += other.controls.quantity.value ?? 1;
    }
  }
  return total;
}

function countKeys(
  keyBuilder: (identity: AuthorizationIdentity) => string | null,
  entries: AuthorizationFormGroup[],
  existingAuthorizations: AdmissionAuthorization[],
  queuedAuthorizations: AuthorizationFormValue[],
): AuthorizationKeyCounts {
  const counts = new Map<string, number>();
  for (const identity of authorizationIdentities(entries, existingAuthorizations, queuedAuthorizations)) {
    const key = keyBuilder(identity);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function authorizationIdentities(
  entries: AuthorizationFormGroup[],
  existingAuthorizations: AdmissionAuthorization[],
  queuedAuthorizations: AuthorizationFormValue[],
): AuthorizationIdentity[] {
  return [
    ...entries.map(identityFromForm),
    ...existingAuthorizations.map((authorization) => ({
      authTypeId: authorization.authTypeId,
      authNumber: authorization.authNumber,
      feeScheduleId: authorization.feeScheduleId,
      mapiissCode: authorization.mapiissCode,
    })),
    ...queuedAuthorizations,
  ];
}

function identityFromForm(formGroup: AuthorizationFormGroup): AuthorizationIdentity {
  return {
    authTypeId: formGroup.controls.authTypeId.value,
    authNumber: formGroup.controls.authNumber.value,
    feeScheduleId: formGroup.controls.feeScheduleId.value,
    mapiissCode: formGroup.controls.mapiissCode.value,
  };
}

function entryKeyOf(identity: AuthorizationIdentity): string | null {
  const authNumber = normalizeCode(identity.authNumber);
  const mapiissCode = normalizeCode(identity.mapiissCode);
  if (!authNumber || !mapiissCode || identity.feeScheduleId === null) return null;
  return `${authNumber}|${identity.feeScheduleId}|${mapiissCode}`;
}

function isCompleteService(identity: AuthorizationIdentity): boolean {
  return identity.feeScheduleId !== null && normalizeCode(identity.mapiissCode) !== null;
}

function belongsToService(candidate: AuthorizationIdentity, identity: AuthorizationIdentity): boolean {
  if (candidate.feeScheduleId === null || identity.feeScheduleId === null) return false;
  return (
    normalizeCode(candidate.mapiissCode) === normalizeCode(identity.mapiissCode) &&
    candidate.feeScheduleId === identity.feeScheduleId
  );
}

function normalizeCode(value: string | null): string | null {
  return value?.trim().toUpperCase() ?? null;
}
