import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import { PatientLookupResponse } from '@shared/models/patient-lookup.model';
import { PatientInfoCardComponent } from './patient-info-card.component';

describe('PatientInfoCardComponent', () => {
  let fixture: ComponentFixture<PatientInfoCardComponent>;
  let component: PatientInfoCardComponent;
  let catalogStore: {
    getCatalog: jest.Mock;
    loadCatalog: jest.Mock;
    versionOf: jest.Mock;
  };

  const patient: PatientLookupResponse = {
    id: 7,
    documentTypeId: 1,
    document: '1020304050',
    firstName: 'María',
    lastName: 'Gómez',
    age: '34',
    address: 'Calle 1',
    phone: '3001234567',
    email: null,
    disability: 'NO',
    userTypeId: 1,
    birthDate: '1992-04-12',
    genderId: 2,
    epsId: 7,
    activeAdmission: null,
    documentType: { id: 1, code: 'CC', description: 'Cédula' },
    gender: { id: 2, description: 'Femenino' },
  };

  beforeEach(async () => {
    catalogStore = {
      getCatalog: jest.fn().mockReturnValue([]),
      versionOf: jest.fn().mockReturnValue(0),
      loadCatalog: jest.fn().mockReturnValue({ subscribe: () => {} }),
    };

    await TestBed.configureTestingModule({
      imports: [PatientInfoCardComponent],
      providers: [{ provide: CatalogStore, useValue: catalogStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientInfoCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('patient', patient);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the full name and document label of the patient', () => {
    expect(component.patientFullName()).toBe('María Gómez');
    expect(component.documentLabel()).toBe('CC 1020304050');
  });

  it('resolves the EPS name from eps-shaped catalog items', () => {
    catalogStore.versionOf.mockReturnValue(1);
    catalogStore.getCatalog.mockImplementation((type: string) =>
      type === 'eps' ? [{ idEps: 7, epsCode: 'EPS-007', epsName: 'Sanitas' }] : [],
    );

    expect(component.epsName()).toBe('Sanitas');
  });
});
