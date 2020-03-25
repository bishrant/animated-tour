import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PointanimationComponent } from './pointanimation.component';

describe('PointanimationComponent', () => {
  let component: PointanimationComponent;
  let fixture: ComponentFixture<PointanimationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PointanimationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PointanimationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
