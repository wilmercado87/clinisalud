import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import {
  AdmissionAuthorization,
  PatientLookupResponse,
} from '@features/admissions/models/admissions.model';
import { AdmissionsService } from '@features/admissions/services/admissions.service';
import { of, Subject, throwError } from 'rxjs';
import { AuthorizationManagerFacade } from './authorization-manager.facade';

describe('AuthorizationManagerFacade', () => {
  let facade: AuthorizationManagerFacade;
  let api: {
    lookupPatient: jest.Mock;
    getAdmissionByNumber: jest.Mock;
    updateAdmission: jest.Mock;
  };
  let catalogStoreMock: {
    getCatalog: jest.Mock;
    loadCatalog: jest.Mock;
    reloadCatalog: jest.Mock;
    contracts: () => unknown[];
    loadContracts: jest.Mock;
    versionOf: jest.Mock;
    invalidateCatalog: jest.Mock;
  };

  const existingAuth: AdmissionAuthorization = {
    authTypeId: 2,
    authTypeName: 'Autorización Previa',
    authNumber: 'AUTH-100',
    mapiissCode: 'CUP-001',
    quantity: 1,
    feeScheduleId: 2,
  };

  const patientResponse: PatientLookupResponse = {
    id: 1,
    documentTypeId: 1,
    document: '12345',
    firstName: 'Juan',
    lastName: 'Perez',
    age: '30',
    address: '',
    phone: '3100000000',
    email: null,
    disability: 'NO',
    userTypeId: 1,
    birthDate: '1996-01-01',
    genderId: 1,
    epsId: 7,
    documentType: { id: 1, code: 'CC', description: 'Cédula' },
    gender: { id: 1, description: 'Masculino' },
    activeAdmission: {
      admissionNumber: 'ADM-20260801-0001',
      admissionDate: '2026-08-01 10:30:00',
      statusId: 3,
      state: 'EN_ATENCION',
      roomId: 5,
      observations: 'Control diario',
      authorizations: [existingAuth],
    },
  };

  beforeEach(async () => {
    api = {
      lookupPatient: jest.fn(),
      getAdmissionByNumber: jest.fn(),
      updateAdmission: jest.fn(),
    };

    catalogStoreMock = {
      getCatalog: jest.fn().mockReturnValue([]),
      loadCatalog: jest.fn().mockReturnValue(of([])),
      reloadCatalog: jest.fn().mockReturnValue(of([])),
      contracts: signal([]).asReadonly(),
      loadContracts: jest.fn(),
      versionOf: jest.fn().mockReturnValue(0),
      invalidateCatalog: jest.fn(),
    };

    await TestBed.configureTestingModule({
      providers: [
        AuthorizationManagerFacade,
        { provide: AdmissionsService, useValue: api },
        { provide: CatalogStore, useValue: catalogStoreMock },
      ],
    }).compileComponents();

    facade = TestBed.inject(AuthorizationManagerFacade);
  });

  it('searches by document and loads patient with existing authorizations', async () => {
    api.lookupPatient.mockReturnValue(of(patientResponse));
    facade.documentForm.setValue({ documentTypeId: 1, document: '12345' });

    await facade.onSearch('document');

    expect(api.lookupPatient).toHaveBeenCalledWith({ documentTypeId: 1, document: '12345' });
    expect(facade.patient()?.firstName).toBe('Juan');
    expect(facade.activeAdmission()?.admissionNumber).toBe('ADM-20260801-0001');
    expect(facade.existingAuthorizations()).toEqual([existingAuth]);
    expect(facade.feedback()).toBeNull();
  });

  it('shows invalid input feedback when document search lacks data', async () => {
    await facade.onSearch('document');

    expect(api.lookupPatient).not.toHaveBeenCalled();
    expect(facade.feedback()?.type).toBe('info');
  });

  it('searches by admission number through the admission endpoint', async () => {
    api.getAdmissionByNumber.mockReturnValue(of(patientResponse));
    facade.admissionNumberForm.setValue({ admissionNumber: 'ADM-20260801-0001' });

    await facade.onSearch('admission');

    expect(api.getAdmissionByNumber).toHaveBeenCalledWith('ADM-20260801-0001');
    expect(facade.patient()).not.toBeNull();
  });

  it('clears the result and informs when nothing is found', async () => {
    api.getAdmissionByNumber.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })),
    );
    facade.admissionNumberForm.setValue({ admissionNumber: 'ADM-999' });

    await facade.onSearch('admission');

    expect(facade.patient()).toBeNull();
    expect(facade.feedback()?.type).toBe('info');
    expect(facade.feedback()?.message).toContain('No se encontró');
  });

  it('queues, edits and removes authorizations before saving', () => {
    facade.appendAuthEntries([
      {
        authTypeId: 5,
        authNumber: 'AUTH-200',
        feeScheduleId: 2,
        mapiissCode: 'CUP-002',
        quantity: 1,
        mapiissDescription: '',
        maxQuantity: null,
      },
    ]);
    expect(facade.queuedAuthForms().length).toBe(1);
    expect(facade.canSave()).toBe(false);

    facade.startEditAuthEntry(0);
    expect(facade.editingEntry()?.index).toBe(0);

    facade.updateAuthEntry(0, {
      authTypeId: 5,
      authNumber: 'AUTH-201',
      feeScheduleId: 2,
      mapiissCode: 'CUP-003',
      quantity: 2,
      mapiissDescription: '',
      maxQuantity: null,
    });
    expect(facade.editingEntry()).toBeNull();
    expect(facade.queuedAuthForms()[0].controls.authNumber.value).toBe('AUTH-201');

    facade.removeAuthEntry(0);
    expect(facade.queuedAuthForms().length).toBe(0);
  });

  it('informs the user when an authorization is queued', () => {
    facade.appendAuthEntries([
      {
        authTypeId: 5,
        authNumber: 'AUTH-200',
        feeScheduleId: 2,
        mapiissCode: 'CUP-002',
        quantity: 1,
        mapiissDescription: '',
        maxQuantity: null,
      },
    ]);

    expect(facade.feedback()?.type).toBe('info');
    expect(facade.feedback()?.message).toContain('agregada a la lista');
  });

  it('saves queued authorizations, clears the queue and reloads the admission', async () => {
    api.lookupPatient.mockReturnValue(of(patientResponse));
    api.getAdmissionByNumber.mockReturnValue(of(patientResponse));
    api.updateAdmission.mockReturnValue(
      of({
        admissionNumber: 'ADM-20260801-0001',
        roomId: 5,
        observations: null,
        authorizations: [existingAuth],
      }),
    );
    facade.documentForm.setValue({ documentTypeId: 1, document: '12345' });
    await facade.onSearch('document');

    facade.appendAuthEntries([
      {
        authTypeId: 5,
        authNumber: 'AUTH-200',
        feeScheduleId: 2,
        mapiissCode: 'CUP-002',
        quantity: 1,
        mapiissDescription: '',
        maxQuantity: null,
      },
    ]);

    await facade.saveAuthorizations();

    expect(api.updateAdmission).toHaveBeenCalledWith('ADM-20260801-0001', {
      authorizations: [
        { authTypeId: 5, authNumber: 'AUTH-200', mapiissCode: 'CUP-002', feeScheduleId: 2, quantity: 1 },
      ],
    });
    expect(facade.queuedAuthForms().length).toBe(0);
    expect(api.getAdmissionByNumber).toHaveBeenCalledWith('ADM-20260801-0001');
    expect(facade.feedback()?.type).toBe('success');
  });

  it('merges saved authorizations into the visible list before the reload completes', async () => {
    const reloadSubject = new Subject<PatientLookupResponse>();
    api.lookupPatient.mockReturnValue(of(patientResponse));
    api.getAdmissionByNumber.mockReturnValue(reloadSubject);
    api.updateAdmission.mockReturnValue(
      of({ admissionNumber: 'ADM-20260801-0001', roomId: 5, observations: null, authorizations: [] }),
    );
    facade.documentForm.setValue({ documentTypeId: 1, document: '12345' });
    await facade.onSearch('document');

    const queued = [
      {
        authTypeId: 5,
        authNumber: 'AUTH-200',
        feeScheduleId: 2,
        mapiissCode: 'CUP-200',
        quantity: 1,
        mapiissDescription: '',
        maxQuantity: null,
      },
      {
        authTypeId: 5,
        authNumber: 'AUTH-201',
        feeScheduleId: 2,
        mapiissCode: 'CUP-201',
        quantity: 1,
        mapiissDescription: '',
        maxQuantity: null,
      },
    ];
    facade.appendAuthEntries(queued);

    const saving = facade.saveAuthorizations();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(facade.queuedAuthForms().length).toBe(0);
    expect(facade.existingAuthorizations().map((auth) => auth.authNumber)).toEqual([
      'AUTH-100',
      'AUTH-200',
      'AUTH-201',
    ]);

    reloadSubject.next(patientResponse);
    reloadSubject.complete();
    await saving;
    expect(facade.isSaving()).toBe(false);
  });

  it('informs when saving without queued authorizations', async () => {
    api.lookupPatient.mockReturnValue(of(patientResponse));
    facade.documentForm.setValue({ documentTypeId: 1, document: '12345' });
    await facade.onSearch('document');

    await facade.saveAuthorizations();

    expect(api.updateAdmission).not.toHaveBeenCalled();
    expect(facade.feedback()?.message).toContain('Agregue al menos una autorización');
  });

  it('resolves the EPS name from eps-shaped catalog items', async () => {
    catalogStoreMock.versionOf.mockReturnValue(1);
    catalogStoreMock.getCatalog.mockImplementation((type: string) =>
      type === 'eps' ? [{ idEps: 7, epsCode: 'EPS-007', epsName: 'Sanitas' }] : [],
    );
    api.lookupPatient.mockReturnValue(of(patientResponse));
    facade.documentForm.setValue({ documentTypeId: 1, document: '12345' });

    await facade.onSearch('document');

    expect(facade.epsName()).toBe('Sanitas');
  });

  it('resetAll clears the search result and both forms', async () => {
    api.lookupPatient.mockReturnValue(of(patientResponse));
    facade.documentForm.setValue({ documentTypeId: 1, document: '12345' });
    await facade.onSearch('document');

    facade.resetAll();

    expect(facade.patient()).toBeNull();
    expect(facade.existingAuthorizations()).toEqual([]);
    expect(facade.documentForm.getRawValue()).toEqual({ documentTypeId: null, document: '' });
  });
});
