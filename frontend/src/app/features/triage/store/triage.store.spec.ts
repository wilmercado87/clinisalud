import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CreateTriageRequest, CreateTriageResponse } from '@features/triage/models/triage.model';
import { TriageStore } from './triage.store';

async function flushResource(): Promise<void> {
  await TestBed.flushEffects();
}

describe('TriageStore', () => {
  let store: TriageStore;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(TriageStore);
    httpMock = TestBed.inject(HttpTestingController);
    await TestBed.flushEffects();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('looks up the patient through the shared admissions endpoint', async () => {
    store.lookupPatient(1, '1020304050');
    await flushResource();
    const req = httpMock.expectOne((r) => r.url.endsWith('/admissions/patient-lookup'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('documentTypeId')).toBe('1');
    req.flush({
      id: 7,
      documentTypeId: 1,
      document: '1020304050',
      firstName: 'Ana',
      lastName: 'Perez',
      age: '35',
      address: '',
      phone: '',
      email: null,
      disability: 'NO',
      userTypeId: 1,
      birthDate: '1990-01-01',
      genderId: 1,
      epsId: 3,
      activeAdmission: null,
    });
    await flushResource();

    expect(store.patientFound()?.firstName).toBe('Ana');
    expect(store.lookupError()).toBeUndefined();
  });

  it('creates a triage through POST /triage (INV-HC-03)', async () => {
    const data: CreateTriageRequest = {
      isNewPatient: false,
      documentTypeId: 1,
      document: '1020304050',
      priorityTypeId: 2,
      epsId: 3,
      diagnosticId: 5,
    };
    const result: CreateTriageResponse = {
      triage: {
        id: 1,
        priorityTypeId: 2,
        pacienteId: 7,
        attentionDate: '2026-08-21 10:00:00',
        epsId: 3,
        diagnosticId: 5,
        systemUserId: 1,
      },
      patient: { id: 7, documentTypeId: 1, document: '1020304050' },
    };

    store.createTriage(data);
    await flushResource();
    const req = httpMock.expectOne((r) => r.url.endsWith('/triage') && r.method === 'POST');
    expect(req.request.body).toEqual(data);
    req.flush(result);
    await flushResource();

    expect(store.createResult()).toEqual(result);
    expect(store.isCreating()).toBe(false);
  });

  it('exposes the create error on failure (INV-HC-03)', async () => {
    store.createTriage({
      isNewPatient: false,
      documentTypeId: 1,
      document: '1020304050',
      priorityTypeId: 99,
      epsId: 3,
      diagnosticId: 5,
    });
    await flushResource();
    const req = httpMock.expectOne((r) => r.url.endsWith('/triage') && r.method === 'POST');
    req.flush({ message: 'La prioridad de triage seleccionada no existe' }, { status: 400, statusText: 'Bad Request' });
    await flushResource();

    expect(store.createResult()).toBeUndefined();
    expect((store.createError() as { status: number }).status).toBe(400);
  });
});
