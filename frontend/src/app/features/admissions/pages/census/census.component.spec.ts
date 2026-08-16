import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ToastService } from '@core/services/toast.service';

import { CensusComponent } from './census.component';

describe('CensusComponent', () => {
  let component: CensusComponent;
  let fixture: ComponentFixture<CensusComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CensusComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ToastService,
          useValue: {
            success: jest.fn(),
            error: jest.fn(),
            info: jest.fn(),
          },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CensusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    httpMock
      .expectOne((r) => r.url.endsWith('/admissions/census'))
      .flush([]);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('reloads the census on init', () => {
    expect(component.isLoadingCensus()).toBe(false);
  });
});