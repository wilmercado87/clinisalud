import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContratoResponse } from '@core/models/catalog.model';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import {
  AdmissionAuthorization,
  PatientLookupResponse,
} from '@features/admissions/models/admissions.model';
import { AuthorizationEntryComponent } from '@features/admissions/components/authorization-entry/authorization-entry.component';
import { AdmissionsService } from '@features/admissions/services/admissions.service';
import { AuthorizationManagerFacade } from '@features/admissions/services/authorization-manager.facade';
import { AdmissionSearchComponent } from '@shared/components/admission-search/admission-search.component';
import { of } from 'rxjs';
import { AuthorizationManagerComponent } from './authorization-manager.component';

describe('AuthorizationManagerComponent', () => {
  let fixture: ComponentFixture<AuthorizationManagerComponent>;
  let facade: AuthorizationManagerFacade;
  let api: { lookupPatient: jest.Mock; getAdmissionByNumber: jest.Mock; updateAdmission: jest.Mock };
  let contractsSignal: ReturnType<typeof signal<ContratoResponse[]>>;

  const existingAuth: AdmissionAuthorization = {
    authTypeId: 2,
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
    phone: '',
    email: null,
    disability: 'NO',
    userTypeId: 1,
    birthDate: '1996-01-01',
    genderId: 1,
    epsId: 7,
    activeAdmission: {
      admissionNumber: 'ADM-20260801-0001',
      admissionDate: '2026-08-01 10:30:00',
      statusId: 3,
      state: 'EN_ATENCION',
      roomId: null,
      observations: null,
      authorizations: [existingAuth],
    },
  };

  beforeEach(async () => {
    api = {
      lookupPatient: jest.fn().mockReturnValue(of(null)),
      getAdmissionByNumber: jest.fn().mockReturnValue(of(null)),
      updateAdmission: jest.fn().mockReturnValue(of(null)),
    };
    contractsSignal = signal<ContratoResponse[]>([
      {
        id: 1,
        name: 'CONTR-01',
        epsId: 7,
        feeScheduleId: 2,
        contractNumber: 'CONTR-01',
        startDate: '1/01/2016',
        endDate: '31/07/2018',
      },
    ]);
    const catalogStoreMock = {
      getCatalog: () => [],
      loadCatalog: jest.fn().mockReturnValue(of([])),
      reloadCatalog: jest.fn().mockReturnValue(of([])),
      contracts: contractsSignal.asReadonly(),
      loadContracts: jest.fn(),
      versionOf: () => 0,
      invalidateCatalog: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AuthorizationManagerComponent],
      providers: [
        { provide: AdmissionsService, useValue: api },
        { provide: CatalogStore, useValue: catalogStoreMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthorizationManagerComponent);
    facade = fixture.debugElement.injector.get(AuthorizationManagerFacade);
    fixture.detectChanges();
  });

  it('renders the module header', () => {
    const title = fixture.nativeElement.querySelector('.authorization-manager__title');
    expect(title.textContent).toContain('Autorizaciones');
  });

  it('renders the unified admission search with both modes', () => {
    expect(fixture.nativeElement.querySelector('app-admission-search')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.admission-search__mode mat-radio-button').length).toBe(2);
  });

  it('delegates the search to the facade with the selected mode', async () => {
    const onSearchSpy = jest.spyOn(facade, 'onSearch').mockResolvedValue();
    facade.documentForm.setValue({ documentTypeId: 1, document: '1020304050' });
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('app-admission-search .admission-search__submit');
    button.click();
    expect(onSearchSpy).toHaveBeenCalledWith('document');

    onSearchSpy.mockClear();
    const searchComponent = fixture.debugElement
      .query((node) => node.name === 'app-admission-search')!
      .injector.get(AdmissionSearchComponent);
    searchComponent.setMode('admission');
    fixture.nativeElement.querySelector('app-admission-search .admission-search__submit').click();

    expect(onSearchSpy).toHaveBeenCalledWith('admission');
  });

  it('delegates the blur auto-search to the facade when the document is complete', () => {
    const onSearchSpy = jest.spyOn(facade, 'onSearch').mockResolvedValue();
    facade.documentForm.setValue({ documentTypeId: 1, document: '1020304050' });
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      'app-admission-search .admission-search__number input',
    );
    input.dispatchEvent(new FocusEvent('blur'));

    expect(onSearchSpy).toHaveBeenCalledWith('document');
  });

  it('resets the search component when cancelling', async () => {
    const searchComponent = fixture.debugElement
      .query((node) => node.name === 'app-admission-search')!
      .injector.get(AdmissionSearchComponent);
    const resetSpy = jest.spyOn(searchComponent, 'reset');

    fixture.componentInstance.onCancel();

    expect(resetSpy).toHaveBeenCalled();
  });

  it('queues an authorization when the embedded entry applies and shows feedback', async () => {
    api.lookupPatient.mockReturnValue(of(patientResponse));
    facade.documentForm.setValue({ documentTypeId: 1, document: '12345' });
    await facade.onSearch('document');
    fixture.detectChanges();

    const entry = fixture.debugElement
      .query((node) => node.name === 'app-authorization-entry')!
      .injector.get(AuthorizationEntryComponent);

    entry.entries()[0].patchValue({
      authTypeId: 5,
      authNumber: 'AUTH-200',
      mapiissCode: 'CUP-002',
      quantity: 1,
    });
    fixture.detectChanges();
    expect(entry.canApply()).toBe(true);

    entry.apply();
    fixture.detectChanges();

    expect(facade.queuedAuthForms().length).toBe(1);
    expect(facade.queuedAuthForms()[0].controls.authNumber.value).toBe('AUTH-200');
    expect(facade.feedback()?.message).toContain('agregada a la lista');
    expect(entry.entries().length).toBe(1);
    expect(entry.entries()[0].controls.authNumber.value).toBe('');
  });
});
