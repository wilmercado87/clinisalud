import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { ManagerUsersComponent } from './manager-users.component';

describe('ManagerUsersComponent', () => {
  let component: ManagerUsersComponent;
  let fixture: ComponentFixture<ManagerUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerUsersComponent],
      providers: [provideHttpClient()]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ManagerUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
