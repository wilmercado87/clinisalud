// @spec:COM-CAT-01 — Validación de selección requerida (rojo tras entrar y salir, mensaje por campo)
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatOption } from '@angular/material/core';
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

describe('CatalogSelectComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, RequiredInputHostComponent],
      providers: [
        {
          provide: CatalogStore,
          useValue: {
            getCatalog: () => [],
            versionOf: () => 0,
            loadCatalog: () => of([]),
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
    expect(cmp.errorMessage()).toBeNull();
  });

  it('muestra el mensaje por campo tras salir del campo requerido vacío', () => {
    const cmp = component();
    cmp.onBlur();

    expect(cmp.errorMatcher.isErrorState(null, null)).toBeTrue();
    expect(cmp.errorMessage()).toBe('Seleccione Tarifario');
  });

  it('muestra Ingreso no válido cuando se escribe un valor que no está en el listado', () => {
    const cmp = component();
    cmp.onInput({ target: { value: "Inexistente" } } as unknown as Event);
    cmp.onBlur();

    expect(cmp.optionInvalid()).toBeTrue();
    expect(cmp.errorMessage()).toBe('Ingreso no válido');
  });

  it('limpia el error al seleccionar una opción válida', () => {
    const cmp = component();
    cmp.onBlur();
    expect(cmp.errorMessage()).toBe('Seleccione Tarifario');

    cmp.onOptionSelected({ value: 1 } as MatOption<number>);

    expect(cmp.value()).toBe(1);
    expect(host.control.value).toBe(1);
    expect(cmp.errorMessage()).toBeNull();
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
    expect(cmp.errorMessage()).toBe('Seleccione Tarifario');

    cmp.forceReset();

    expect(cmp.errorMatcher.isErrorState(null, null)).toBeFalse();
    expect(cmp.errorMessage()).toBeNull();
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
});