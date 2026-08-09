// @spec:INV-ADM-02 — Control de Autorizaciones por Servicio (build del request)
import { applyAdmissionFormState, buildAdmissionRequest, buildAuthorizationsRequest, buildCompanionRequest, toApiBirthDate } from './admission-form.builder';
import {
  createAdmissionForm,
  createAuthEntryForm,
  createCompanionForm,
  createPatientForm,
} from './admission-form.factory';

describe('admission-form.builder', () => {
  describe('buildCompanionRequest', () => {
    it('returns undefined when every field is blank', () => {
      expect(
        buildCompanionRequest({
          firstName: '',
          lastName: '',
          documentTypeId: null,
          document: '',
          address: '',
          relationshipId: null,
          phone: '',
        }),
      ).toBeUndefined();
    });

    it('builds a companion with defaults for null ids', () => {
      const companion = buildCompanionRequest({
        firstName: 'Luis',
        lastName: 'Gomez',
        documentTypeId: null,
        document: '123456',
        address: 'Calle 2',
        relationshipId: null,
        phone: '3000000000',
      });

      expect(companion).toEqual({
        firstName: 'Luis',
        lastName: 'Gomez',
        documentTypeId: 0,
        document: '123456',
        address: 'Calle 2',
        relationshipId: 0,
        phone: '3000000000',
      });
    });
  });

  describe('buildAuthorizationsRequest', () => {
    it('returns undefined when disabled', () => {
      expect(buildAuthorizationsRequest([], false)).toBeUndefined();
      expect(buildAuthorizationsRequest([createAuthEntryForm()], false)).toBeUndefined();
    });

    it('maps entries with a default quantity of 1', () => {
      const form = createAuthEntryForm();
      form.patchValue({
        authTypeId: 2,
        authNumber: 'AUTH-001',
        mapiissCode: 'CUP-X',
        quantity: 3,
      });

      const authorizations = buildAuthorizationsRequest([form], true);
      expect(authorizations).toEqual([
        { authTypeId: 2, authNumber: 'AUTH-001', mapiissCode: 'CUP-X', feeScheduleId: 0, quantity: 3 },
      ]);
    });

    it('uses 1 when quantity is null', () => {
      const form = createAuthEntryForm();
      form.controls.quantity.setValue(null);

      const authorizations = buildAuthorizationsRequest([form], true);
      expect(authorizations?.[0].quantity).toBe(1);
    });
  });

  describe('toApiBirthDate', () => {
    it('formats a Date as ISO string', () => {
      expect(toApiBirthDate(new Date(1990, 0, 1))).toBe('1990-01-01');
    });

    it('passes strings through', () => {
      expect(toApiBirthDate('1990-01-01')).toBe('1990-01-01');
    });

    it('returns undefined for nullish values', () => {
      expect(toApiBirthDate(null)).toBeUndefined();
    });
  });

  describe('buildAdmissionRequest', () => {
    const patient = {
      documentTypeId: 1,
      document: '1020304050',
      firstName: 'Ana',
      lastName: 'Perez',
      birthDate: new Date(1990, 0, 1),
      genderId: 1,
      age: '35',
      disability: 'NO',
      userTypeId: 1,
      address: 'Calle 1',
      phone: '3001234567',
      email: 'ana@correo.com',
    };
    const admission = {
      epsId: 3,
      roomId: 4,
      observations: 'Ingreso por urgencias',
    };
    const emptyCompanion = {
      firstName: '',
      lastName: '',
      documentTypeId: null,
      document: '',
      address: '',
      relationshipId: null,
      phone: '',
    };

    it('builds a full request for a new patient', () => {
      const request = buildAdmissionRequest({
        isNewPatient: true,
        patient,
        admission,
        companion: emptyCompanion,
        authForms: [],
        authorizationsEnabled: false,
      });

      expect(request).toEqual({
        isNewPatient: true,
        documentTypeId: 1,
        document: '1020304050',
        firstName: 'Ana',
        lastName: 'Perez',
        birthDate: '1990-01-01',
        genderId: 1,
        age: '35',
        disability: 'NO',
        userTypeId: 1,
        address: 'Calle 1',
        phone: '3001234567',
        email: 'ana@correo.com',
        epsId: 3,
        roomId: 4,
        observations: 'Ingreso por urgencias',
        companion: undefined,
        authorizations: undefined,
      });
    });

    it('omits optional fields when blank', () => {
      const request = buildAdmissionRequest({
        isNewPatient: false,
        patient: { ...patient, firstName: '', birthDate: null, genderId: null },
        admission,
        companion: emptyCompanion,
        authForms: [],
        authorizationsEnabled: false,
      });

      expect(request).toEqual({
        isNewPatient: false,
        documentTypeId: 1,
        document: '1020304050',
        firstName: undefined,
        lastName: 'Perez',
        birthDate: undefined,
        genderId: undefined,
        age: '35',
        disability: 'NO',
        userTypeId: 1,
        address: 'Calle 1',
        phone: '3001234567',
        email: 'ana@correo.com',
        epsId: 3,
        roomId: 4,
        observations: 'Ingreso por urgencias',
        companion: undefined,
        authorizations: undefined,
      });
    });

    it('sends an empty email when the user clears it', () => {
      const request = buildAdmissionRequest({
        isNewPatient: false,
        patient: { ...patient, email: '' },
        admission,
        companion: emptyCompanion,
        authForms: [],
        authorizationsEnabled: false,
      });

      expect(request.email).toBe('');
    });
  });

  describe('applyAdmissionFormState', () => {
    const forms = () => ({
      patient: createPatientForm(new Date(2026, 0, 15)),
      companion: createCompanionForm(),
      admission: createAdmissionForm(),
    });

    it('enables search controls and disables data controls on IDLE', () => {
      const { patient, companion, admission } = forms();
      applyAdmissionFormState({ patient, companion, admission }, 'IDLE');

      expect(patient.controls.documentTypeId.enabled).toBeTrue();
      expect(patient.controls.document.enabled).toBeTrue();
      expect(patient.controls.firstName.enabled).toBeFalse();
      expect(companion.controls.firstName.enabled).toBeFalse();
      expect(admission.controls.epsId.enabled).toBeFalse();
    });

    it('enables data controls on FOUND', () => {
      const { patient, companion, admission } = forms();
      applyAdmissionFormState({ patient, companion, admission }, 'FOUND');

      expect(patient.controls.documentTypeId.enabled).toBeFalse();
      expect(patient.controls.firstName.enabled).toBeTrue();
      expect(companion.controls.firstName.enabled).toBeTrue();
      expect(admission.controls.observations.enabled).toBeTrue();
    });

    it('enables both search and data controls on NOT_FOUND', () => {
      const { patient, companion, admission } = forms();
      applyAdmissionFormState({ patient, companion, admission }, 'NOT_FOUND');

      expect(patient.controls.document.enabled).toBeTrue();
      expect(patient.controls.birthDate.enabled).toBeTrue();
      expect(admission.controls.roomId.enabled).toBeTrue();
    });
  });
});
