import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterFormDialogComponent } from './character-form-dialog.component';

describe('CharacterFormDialogComponent', () => {
  let component: CharacterFormDialogComponent;
  let fixture: ComponentFixture<CharacterFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterFormDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CharacterFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
