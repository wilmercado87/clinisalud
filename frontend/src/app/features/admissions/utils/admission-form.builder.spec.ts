// @spec:INV-ADM-02 — Control de Autorizaciones por Servicio (build del request)
// @spec:INV-ADM-07 — Actualización de Admisión Activa (build del request de actualización)
import {
  applyAdmissionFormState,
  buildAdmissionRequest,
  buildAuthorizationsRequest,
  buildCompanionRequest,
  buildUpdateAdmissionRequest,
  toApiBirthDate,
} from './admission-form.builder';
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

    it('omits roomId from the payload when no bed is selected (INV-ADM-01)', () => {
      const request = buildAdmissionRequest({
        isNewPatient: true,
        patient,
        admission: { ...admission, roomId: null },
        companion: emptyCompanion,
        authForms: [],
        authorizationsEnabled: false,
      });

      expect(request.roomId).toBeUndefined();
      expect(JSON.stringify(request)).not.toContain('roomId');
    });
  });

  describe('buildUpdateAdmissionRequest', () => {
    it('returns an empty request when nothing changed', () => {
      const request = buildUpdateAdmissionRequest({
        roomId: null,
        previousRoomId: null,
        authForms: [],
        authorizationsEnabled: false,
      });

      expect(request).toEqual({});
    });

    it('sends only the changed bed when reassigning (INV-ADM-07)', () => {
      const request = buildUpdateAdmissionRequest({
        roomId: 2,
        previousRoomId: 1,
        authForms: [],
        authorizationsEnabled: false,
      });

      expect(request).toEqual({ roomId: 2 });
    });

    it('omits roomId when the same bed is selected (INV-ADM-07)', () => {
      const request = buildUpdateAdmissionRequest({
        roomId: 1,
        previousRoomId: 1,
        authForms: [],
        authorizationsEnabled: false,
      });

      expect(request).toEqual({});
    });

    it('includes authorizations when entries were added (INV-ADM-07)', () => {
      const form = createAuthEntryForm();
      form.patchValue({
        authTypeId: 2,
        authNumber: 'AUTH-100',
        mapiissCode: 'CUP-100',
        quantity: 2,
      });

      const request = buildUpdateAdmissionRequest({
        roomId: null,
        previousRoomId: null,
        authForms: [form],
        authorizationsEnabled: true,
      });

      expect(request.authorizations).toEqual([
        { authTypeId: 2, authNumber: 'AUTH-100', mapiissCode: 'CUP-100', feeScheduleId: 0, quantity: 2 },
      ]);
      expect('roomId' in request).toBe(false);
    });

    it('sends only the changed observations (INV-ADM-07)', () => {
      const request = buildUpdateAdmissionRequest({
        roomId: null,
        previousRoomId: null,
        observations: 'Requiere control diario',
        previousObservations: 'Observación anterior',
        authForms: [],
        authorizationsEnabled: false,
      });

      expect(request).toEqual({ observations: 'Requiere control diario' });
    });

    it('omits observations when unchanged (INV-ADM-07)', () => {
      const request = buildUpdateAdmissionRequest({
        roomId: 1,
        previousRoomId: 1,
        observations: 'Sin cambios',
        previousObservations: 'Sin cambios',
        authForms: [],
        authorizationsEnabled: false,
      });

      expect(request).toEqual({});
    });

    it('sends empty observations to clear them (INV-ADM-07)', () => {
      const request = buildUpdateAdmissionRequest({
        roomId: null,
        previousRoomId: null,
        observations: '',
        previousObservations: 'A limpiar',
        authForms: [],
        authorizationsEnabled: false,
      });

      expect(request).toEqual({ observations: '' });
    });

    it('sends bed and observations together when both changed (INV-ADM-07)', () => {
      const request = buildUpdateAdmissionRequest({
        roomId: 2,
        previousRoomId: 1,
        observations: 'Nueva observación',
        previousObservations: null,
        authForms: [],
        authorizationsEnabled: false,
      });

      expect(request).toEqual({ roomId: 2, observations: 'Nueva observación' });
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
      applyAdmissionFormState({ patient, companion, admission }, 'IDLE', false);

      expect(patient.controls.documentTypeId.enabled).toBe(true);
      expect(patient.controls.document.enabled).toBe(true);
      expect(patient.controls.firstName.enabled).toBe(false);
      expect(companion.controls.firstName.enabled).toBe(false);
      expect(admission.controls.epsId.enabled).toBe(false);
    });

    it('enables data controls on FOUND', () => {
      const { patient, companion, admission } = forms();
      applyAdmissionFormState({ patient, companion, admission }, 'FOUND', false);

      expect(patient.controls.documentTypeId.enabled).toBe(false);
      expect(patient.controls.firstName.enabled).toBe(true);
      expect(companion.controls.firstName.enabled).toBe(true);
      expect(admission.controls.observations.enabled).toBe(true);
    });

    it('enables both search and data controls on NOT_FOUND', () => {
      const { patient, companion, admission } = forms();
      applyAdmissionFormState({ patient, companion, admission }, 'NOT_FOUND', false);

      expect(patient.controls.document.enabled).toBe(true);
      expect(patient.controls.birthDate.enabled).toBe(true);
      expect(admission.controls.roomId.enabled).toBe(true);
    });

    it('keeps only the bed enabled when the patient has an active admission (INV-ADM-07)', () => {
      const { patient, companion, admission } = forms();
      applyAdmissionFormState({ patient, companion, admission }, 'FOUND', true);

      expect(patient.controls.firstName.enabled).toBe(false);
      expect(patient.controls.document.enabled).toBe(false);
      expect(companion.controls.firstName.enabled).toBe(false);
      expect(admission.controls.epsId.enabled).toBe(false);
      expect(admission.controls.observations.enabled).toBe(false);
      expect(admission.controls.roomId.enabled).toBe(true);
    });
  });
});
