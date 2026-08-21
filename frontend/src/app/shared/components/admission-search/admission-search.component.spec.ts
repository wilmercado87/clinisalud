import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import { AdmissionSearchComponent, AdmissionSearchMode } from './admission-search.component';
import { of } from 'rxjs';

describe('AdmissionSearchComponent', () => {
  let fixture: ComponentFixture<AdmissionSearchComponent>;
  let component: AdmissionSearchComponent;

  async function create(admissionNumberControl?: FormControl<string>): Promise<void> {
    const catalogStoreMock = {
      getCatalog: () => [],
      loadCatalog: jest.fn().mockReturnValue(of([])),
      reloadCatalog: jest.fn().mockReturnValue(of([])),
      contracts: signal([]).asReadonly(),
      loadContracts: jest.fn(),
      versionOf: () => 0,
      invalidateCatalog: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdmissionSearchComponent],
      providers: [{ provide: CatalogStore, useValue: catalogStoreMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdmissionSearchComponent);
    fixture.componentRef.setInput('documentTypeIdControl', new FormControl<number | null>(null));
    fixture.componentRef.setInput('documentControl', new FormControl<string>('', { nonNullable: true }));
    if (admissionNumberControl) {
      fixture.componentRef.setInput('admissionNumberControl', admissionNumberControl);
    }
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function searchButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.admission-search__submit');
  }

  function collectModes(): AdmissionSearchMode[] {
    const emissions: AdmissionSearchMode[] = [];
    component.searched.subscribe((mode) => emissions.push(mode));
    return emissions;
  }

  function documentInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('.admission-search__number input');
  }

  function documentError(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.admission-search__number mat-error');
  }

  it('hides the mode toggle when no admission control is provided', async () => {
    await create();

    expect(fixture.nativeElement.querySelector('.admission-search__mode')).toBeNull();
    expect(fixture.nativeElement.querySelector('.admission-search__type')).toBeTruthy();
  });

  it('shows the mode toggle when an admission control is provided', async () => {
    await create(new FormControl<string>('', { nonNullable: true }));

    expect(fixture.nativeElement.querySelectorAll('.admission-search__mode mat-radio-button').length).toBe(2);
  });

  it('emits document mode by default from the button and Enter key', async () => {
    await create();
    const emissions = collectModes();
    component.documentTypeIdControl().setValue(1);
    component.documentControl().setValue('1020304050');
    fixture.detectChanges();

    searchButton().click();
    documentInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(emissions).toEqual(['document', 'document']);
  });

  it('blocks empty document searches and shows the required message instead', async () => {
    await create();
    const emissions = collectModes();

    searchButton().click();
    fixture.detectChanges();

    expect(emissions).toEqual([]);
    expect(documentError()?.textContent).toContain('Número Documento requerido');
  });

  it('shows the required message when leaving an empty document field on blur', async () => {
    await create();

    documentInput().dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();

    expect(documentError()?.textContent).toContain('Número Documento requerido');

    component.documentControl().setValue('1020304050');
    fixture.detectChanges();
    expect(documentError()).toBeNull();
  });

  it('gives the internal required message precedence over the external one when empty', async () => {
    await create();
    fixture.componentRef.setInput('documentErrorMessage', 'El número de documento es requerido');

    documentInput().dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();

    expect(documentError()?.textContent).toContain('Número Documento requerido');
  });

  it('shows the external message for an invalid non-empty value', async () => {
    await create();
    fixture.componentRef.setInput('documentErrorMessage', 'Solo se permiten números');

    const control = component.documentControl();
    control.setValue('abc');
    control.setErrors({ invalidNumeric: true });
    control.markAsTouched();
    fixture.detectChanges();

    expect(documentError()?.textContent).toContain('Solo se permiten números');
  });

  it('clears the required message once the document is filled', async () => {
    await create();
    const emissions = collectModes();

    searchButton().click();
    fixture.detectChanges();
    expect(documentError()).toBeTruthy();

    component.documentTypeIdControl().setValue(1);
    component.documentControl().setValue('1020304050');
    fixture.detectChanges();

    expect(documentError()).toBeNull();

    searchButton().click();
    expect(emissions).toEqual(['document']);
  });

  it('resets controls, messages and notifies when the mode changes', async () => {
    const admissionControl = new FormControl<string>('ADM-1', { nonNullable: true });
    await create(admissionControl);
    const modeChanges: AdmissionSearchMode[] = [];
    component.modeChanged.subscribe((mode) => modeChanges.push(mode));
    component.documentTypeIdControl().setValue(1);
    component.documentControl().setValue('1020304050');

    component.setMode('admission');
    fixture.detectChanges();

    expect(modeChanges).toEqual(['admission']);
    expect(component.documentTypeIdControl().value).toBeNull();
    expect(component.documentControl().value).toBe('');
    expect(admissionControl.value).toBe('');

    component.setMode('document');
    fixture.detectChanges();
    expect(component.documentTypeIdControl().value).toBeNull();
    expect(component.documentControl().value).toBe('');
    expect(documentError()).toBeNull();
  });

  it('reset() clears fields, messages and forces the catalog select clean', async () => {
    await create(new FormControl<string>('', { nonNullable: true }));
    const selectDebug = fixture.debugElement.query((node) => node.name === 'app-catalog-select')!;
    const selectInstance = selectDebug.injector.get(
      (await import('@shared/components/catalog-select/catalog-select.component')).CatalogSelectComponent,
    );
    const forceResetSpy = jest.spyOn(selectInstance, 'forceReset');

    documentInput().dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(documentError()).toBeTruthy();

    component.reset();
    fixture.detectChanges();

    expect(forceResetSpy).toHaveBeenCalled();
    expect(documentError()).toBeNull();
    expect(component.documentControl().value).toBe('');
  });

  it('does not emit while searching or when disabled', async () => {
    await create();
    const searchedSpy = jest.fn();
    component.searched.subscribe(searchedSpy);

    fixture.componentRef.setInput('isSearching', true);
    fixture.detectChanges();
    searchButton().click();
    expect(searchedSpy).not.toHaveBeenCalled();

    fixture.componentRef.setInput('isSearching', false);
    fixture.componentRef.setInput('searchDisabled', true);
    fixture.detectChanges();
    searchButton().click();
    expect(searchedSpy).not.toHaveBeenCalled();
  });

  it('shows the spinner instead of the icon while searching', async () => {
    await create();
    fixture.componentRef.setInput('isSearching', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeTruthy();
    expect(searchButton().disabled).toBe(true);
  });

  it('emits documentBlurred only from the document input', async () => {
    await create(new FormControl<string>('', { nonNullable: true }));
    const blurredSpy = jest.fn();
    component.documentBlurred.subscribe(blurredSpy);

    documentInput().dispatchEvent(new FocusEvent('blur'));

    expect(blurredSpy).toHaveBeenCalledTimes(1);
  });
});
