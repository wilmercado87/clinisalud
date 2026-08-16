// @spec:COM-CAT-01 — Validación de selección requerida (rojo tras entrar y salir, mensaje por campo)
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatOption } from '@angular/material/core';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { CatalogSelectComponent } from './catalog-select.component';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';

@Component({
  selector: 'app-catalog-select-host',
  standalone: true,
  imports: [CatalogSelectComponent, ReactiveFormsModule],
  template: `
    <app-catalog-select
      catalogType="fee-schedules"
      label="Tarifario"
      [formControl]="control"
    />
  `,
})
class HostComponent {
  control = new FormControl<number | null>(null, Validators.required);
}

@Component({
  selector: 'app-catalog-select-required-host',
  standalone: true,
  imports: [CatalogSelectComponent, ReactiveFormsModule],
  template: `
    <app-catalog-select
      catalogType="fee-schedules"
      label="Tarifario"
      [formControl]="control"
      [required]="required"
    />
  `,
})
class RequiredInputHostComponent {
  control = new FormControl<number | null>(null);
  required = false;
}

@Component({
  selector: 'app-catalog-select-beds-host',
  standalone: true,
  imports: [CatalogSelectComponent, ReactiveFormsModule],
  template: `
    <app-catalog-select
      catalogType="beds"
      label="Cama"
      [formControl]="control"
      [includeOccupiedBeds]="includeOccupiedBeds"
      [clearable]="clearable"
    />
  `,
})
class BedsHostComponent {
  control = new FormControl<number | null>(null);
  includeOccupiedBeds = false;
  clearable = true;
}

const BEDS_FIXTURE = [
  { roomId: 1, bedCode: 'HAB101', bedStatus: 1, tipoCama: 'hospitalizado' },
  { roomId: 2, bedCode: 'HAB102', bedStatus: 0, tipoCama: 'hospitalizado' },
];

describe('CatalogSelectComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, RequiredInputHostComponent, BedsHostComponent],
      providers: [
        {
          provide: CatalogStore,
          useValue: {
            getCatalog: () => [],
            versionOf: () => 0,
            loadCatalog: (type: string) =>
              of(type === 'beds' ? BEDS_FIXTURE : []),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function component(): CatalogSelectComponent {
    return fixture.debugElement.query(
      (el) => el.componentInstance instanceof CatalogSelectComponent,
    ).componentInstance;
  }

  it('no muestra error hasta que el usuario entra y sale del campo', () => {
    const cmp = component();
    expect(cmp.errorMatcher.isErrorState(null, null)).toBeFalse();
    expect(cmp.resolvedErrorMessage()).toBeNull();
  });

  it('muestra el mensaje por campo tras salir del campo requerido vacío', () => {
    const cmp = component();
    cmp.onBlur();

    expect(cmp.errorMatcher.isErrorState(null, null)).toBeTrue();
    expect(cmp.resolvedErrorMessage()).toBe('Seleccione Tarifario');
  });

  it('muestra Ingreso no válido cuando se escribe un valor que no está en el listado', () => {
    const cmp = component();
    cmp.onInput({ target: { value: "Inexistente" } } as unknown as Event);
    cmp.onBlur();

    expect(cmp.optionInvalid()).toBeTrue();
    expect(cmp.resolvedErrorMessage()).toBe('Ingreso no válido');
  });

  it('limpia el error al seleccionar una opción válida', () => {
    const cmp = component();
    cmp.onBlur();
    expect(cmp.resolvedErrorMessage()).toBe('Seleccione Tarifario');

    cmp.onOptionSelected({ value: 1 } as MatOption<number>);

    expect(cmp.value()).toBe(1);
    expect(host.control.value).toBe(1);
    expect(cmp.resolvedErrorMessage()).toBeNull();
    expect(cmp.errorMatcher.isErrorState(null, null)).toBeFalse();
  });

  it('refleja el asterisco de requerido cuando el control pasa a requerido', () => {
    const cmp = component();
    expect(cmp.isRequired()).toBeTrue();

    host.control.clearValidators();
    host.control.updateValueAndValidity();
    fixture.detectChanges();
    expect(cmp.isRequired()).toBeFalse();

    host.control.setValidators(Validators.required);
    host.control.updateValueAndValidity();
    fixture.detectChanges();
    expect(cmp.isRequired()).toBeTrue();
  });

  it('forceReset limpia el rojo dejado tras entrar y salir del campo', () => {
    const cmp = component();
    cmp.onBlur();
    expect(cmp.resolvedErrorMessage()).toBe('Seleccione Tarifario');

    cmp.forceReset();

    expect(cmp.errorMatcher.isErrorState(null, null)).toBeFalse();
    expect(cmp.resolvedErrorMessage()).toBeNull();
  });

  it('el input required fuerza el asterisco aunque el control no tenga validator', () => {
    const hostFixture = TestBed.createComponent(RequiredInputHostComponent);
    hostFixture.componentInstance.required = true;
    hostFixture.detectChanges();
    const cmp = hostFixture.debugElement.query(
      (el) => el.componentInstance instanceof CatalogSelectComponent,
    ).componentInstance as CatalogSelectComponent;

    expect(cmp.isRequired()).toBeTrue();

    hostFixture.componentInstance.required = false;
    hostFixture.detectChanges();
    expect(cmp.isRequired()).toBeFalse();
  });

  it('filtra camas ocupadas por defecto y las incluye deshabilitadas con includeOccupiedBeds', async () => {
    const hostFixture = TestBed.createComponent(BedsHostComponent);
    hostFixture.componentInstance.includeOccupiedBeds = false;
    hostFixture.detectChanges();
    await hostFixture.whenStable();
    const cmp = hostFixture.debugElement.query(
      (el) => el.componentInstance instanceof CatalogSelectComponent,
    ).componentInstance as CatalogSelectComponent;

    expect(cmp.items().map((item) => item.id)).toEqual([2]);
    expect(cmp.isOptionDisabled(cmp.items()[0])).toBeFalse();

    hostFixture.componentInstance.includeOccupiedBeds = true;
    hostFixture.detectChanges();
    await hostFixture.whenStable();

    expect(cmp.items().map((item) => item.id)).toEqual([1, 2]);
    const occupied = cmp.items().find((item) => item.id === 1)!;
    expect(cmp.isOptionDisabled(occupied)).toBeTrue();

    cmp.writeValue(1);
    hostFixture.detectChanges();
    expect(cmp.isOptionDisabled(occupied)).toBeFalse();
    expect(cmp.selectedDescription()).toContain('HAB101');
  });

  it('keeps the assigned value when blurring with unmatched text', async () => {
    const hostFixture = TestBed.createComponent(BedsHostComponent);
    hostFixture.componentInstance.includeOccupiedBeds = true;
    hostFixture.detectChanges();
    await hostFixture.whenStable();
    const cmp = hostFixture.debugElement.query(
      (el) => el.componentInstance instanceof CatalogSelectComponent,
    ).componentInstance as CatalogSelectComponent;

    cmp.writeValue(1);
    hostFixture.detectChanges();
    expect(cmp.selectedDescription()).toContain('HAB101');

    cmp.onInput({ target: { value: 'HAB' } } as unknown as Event);
    cmp.onBlur();
    hostFixture.detectChanges();

    expect(cmp.value()).toBe(1);
    expect(cmp.searchTerm()).toContain('HAB101');
    expect(cmp.optionInvalid()).toBeFalse();
  });

  it('does not select a disabled occupied bed typed on blur', async () => {
    const hostFixture = TestBed.createComponent(BedsHostComponent);
    hostFixture.componentInstance.includeOccupiedBeds = true;
    hostFixture.detectChanges();
    await hostFixture.whenStable();
    const cmp = hostFixture.debugElement.query(
      (el) => el.componentInstance instanceof CatalogSelectComponent,
    ).componentInstance as CatalogSelectComponent;

    cmp.writeValue(2);
    hostFixture.detectChanges();

    cmp.onInput({ target: { value: 'HAB101 - hospitalizado' } } as unknown as Event);
    cmp.onBlur();
    hostFixture.detectChanges();

    expect(cmp.value()).toBe(2);
    expect(cmp.searchTerm()).toContain('HAB102');
  });

  it('hides the clear button when clearable is false', async () => {
    const hostFixture = TestBed.createComponent(BedsHostComponent);
    hostFixture.componentInstance.includeOccupiedBeds = true;
    hostFixture.componentInstance.clearable = false;
    hostFixture.detectChanges();
    await hostFixture.whenStable();
    const cmp = hostFixture.debugElement.query(
      (el) => el.componentInstance instanceof CatalogSelectComponent,
    ).componentInstance as CatalogSelectComponent;

    cmp.writeValue(1);
    hostFixture.detectChanges();
    expect(hostFixture.debugElement.query(By.css('button[matSuffix]'))).toBeNull();

    hostFixture.componentInstance.clearable = true;
    hostFixture.detectChanges();
    expect(hostFixture.debugElement.query(By.css('button[matSuffix]'))).not.toBeNull();
  });

  it('shows all options when the text matches the current selection', async () => {
    const hostFixture = TestBed.createComponent(BedsHostComponent);
    hostFixture.componentInstance.includeOccupiedBeds = true;
    hostFixture.detectChanges();
    await hostFixture.whenStable();
    const cmp = hostFixture.debugElement.query(
      (el) => el.componentInstance instanceof CatalogSelectComponent,
    ).componentInstance as CatalogSelectComponent;

    cmp.writeValue(1);
    hostFixture.detectChanges();
    expect(cmp.filteredItems().map((item) => item.id)).toEqual([1, 2]);

    cmp.onInput({ target: { value: 'HAB102' } } as unknown as Event);
    hostFixture.detectChanges();
    expect(cmp.filteredItems().map((item) => item.id)).toEqual([2]);
  });
});