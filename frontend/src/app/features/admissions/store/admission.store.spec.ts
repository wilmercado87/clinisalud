import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { AdmissionStore } from './admission.store';
import { CreateAdmissionRequest, CreateAdmissionResponse, DischargeAdmissionResponse, PatientLookupResponse } from '@features/admissions/models/admissions.model';

async function flushResource(): Promise<void> {
  await TestBed.flushEffects();
}

describe('AdmissionStore', () => {
  let store: AdmissionStore;
  let httpMock: HttpTestingController;

  const patient: PatientLookupResponse = {
    id: 7,
    documentTypeId: 1,
    document: '1020304050',
    firstName: 'Ana',
    lastName: 'Perez',
    age: '35',
    address: 'Calle 1',
    phone: '3001234567',
    email: 'ana@correo.com',
    disability: 'NO',
    userTypeId: 1,
    birthDate: '1990-01-01',
    genderId: 1,
    epsId: 3,
    activeAdmission: null,
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(AdmissionStore);
    httpMock = TestBed.inject(HttpTestingController);
    await TestBed.flushEffects();
    httpMock.expectOne((r) => r.url.endsWith('/admissions/census')).flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('looks up a patient by document', async () => {
    store.lookupPatient(1, '1020304050');
    await flushResource();
    const req = httpMock.expectOne((r) => r.url.endsWith('/admissions/patient-lookup'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('documentTypeId')).toBe('1');
    expect(req.request.params.get('document')).toBe('1020304050');
    req.flush(patient);
    await flushResource();

    expect(store.patientFound()).toEqual(patient);
    expect(store.lookupError()).toBeUndefined();
  });

  it('exposes the lookup error on failure', async () => {
    store.lookupPatient(1, '999');
    await flushResource();
    const req = httpMock.expectOne((r) => r.url.endsWith('/admissions/patient-lookup'));
    req.flush({ message: 'Paciente no encontrado' }, { status: 404, statusText: 'Not Found' });
    await flushResource();

    expect(store.patientFound()).toBeUndefined();
    expect(store.lookupError()).toBeInstanceOf(HttpErrorResponse);
    expect((store.lookupError() as HttpErrorResponse).status).toBe(404);
  });

  it('creates an admission', async () => {
    const data: CreateAdmissionRequest = {
      isNewPatient: true,
      documentTypeId: 1,
      document: '1020304050',
      firstName: 'Ana',
      epsId: 3,
      roomId: 4,
      observations: 'Ingreso por urgencias',
    };
    const result: CreateAdmissionResponse = {
      admissionNumber: '2026-000001',
      patient: { id: 7, documentTypeId: 1, document: '1020304050' },
      admission: {
        admissionNumber: '2026-000001',
        invoiceNumber: null,
        patientId: 7,
        admissionDate: '2026-08-01',
        roomId: 4,
        epsId: 3,
        observations: 'Ingreso por urgencias',
        statusId: 1,
        systemUserId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    store.createAdmission(data);
    await flushResource();
    const req = httpMock.expectOne((r) => r.url.endsWith('/admissions') && r.method === 'POST');
    expect(req.request.body).toEqual(data);
    req.flush(result);
    await flushResource();

    expect(store.createResult()).toEqual(result);
    expect(store.createError()).toBeUndefined();
  });

  it('exposes the create error on failure', async () => {
    store.createAdmission({
      isNewPatient: false,
      documentTypeId: 1,
      document: '1020304050',
      epsId: 3,
      roomId: 4,
      observations: 'Ingreso',
    });
    await flushResource();
    const req = httpMock.expectOne((r) => r.url.endsWith('/admissions') && r.method === 'POST');
    req.flush({ message: 'La cama seleccionada no está disponible' }, { status: 409, statusText: 'Conflict' });
    await flushResource();

    expect(store.createResult()).toBeUndefined();
    expect((store.createError() as HttpErrorResponse).status).toBe(409);
  });

  it('loads the census', async () => {
    store.reloadCensus();
    await flushResource();
    const req = httpMock.expectOne((r) => r.url.endsWith('/admissions/census'));
    expect(req.request.method).toBe('GET');
    req.flush([]);
    await flushResource();

    expect(store.census()).toEqual([]);
  });

  it('discharges an admission', async () => {
    const result: DischargeAdmissionResponse = {
      admissionNumber: '2026-000001',
      statusId: 5,
      roomId: null,
      dischargedAt: '2026-08-04T12:00:00.000Z',
    };

    store.dischargeAdmission('2026-000001');
    await flushResource();
    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/admissions/2026-000001/discharge') && r.method === 'POST',
    );
    req.flush(result);
    await flushResource();

    expect(store.dischargeResult()).toEqual(result);
    expect(store.dischargeError()).toBeUndefined();
  });

  it('exposes the discharge error on failure', async () => {
    store.dischargeAdmission('2026-000001');
    await flushResource();
    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/admissions/2026-000001/discharge') && r.method === 'POST',
    );
    req.flush(
      { message: 'La admisión ya fue egresada' },
      { status: 409, statusText: 'Conflict' },
    );
    await flushResource();

    expect(store.dischargeResult()).toBeUndefined();
    expect((store.dischargeError() as HttpErrorResponse).status).toBe(409);
  });
});
