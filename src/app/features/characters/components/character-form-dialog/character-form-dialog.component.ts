import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Character } from '../../../../core/models/character.model';

export interface CharacterFormDialogData {
  mode: 'create' | 'edit';
  character: Character | null;
}

@Component({
  selector: 'app-character-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './character-form-dialog.component.html',
  styleUrl: './character-form-dialog.component.scss'
})
export class CharacterFormDialogComponent implements OnInit {
  characterForm!: FormGroup;
  dialogTitle: string;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CharacterFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CharacterFormDialogData
  ) {
    this.dialogTitle = data.mode === 'create' ? 'Create New Character' : 'Edit Character';
}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.characterForm = this.fb.group({
      name: [this.data.character?.name || '', [Validators.required]],
      description: [this.data.character?.description || ''],
      thumbnail: this.fb.group({
        path: [this.data.character?.thumbnail?.path || 'http://i.annihil.us/u/prod/marvel/i/mg/b/40/image_not_available'],
        extension: [this.data.character?.thumbnail?.extension || 'jpg']
      })
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
  if (this.characterForm.valid) {
    const formValues = this.characterForm.value;

    // Create character object to return
    const characterData: any = {
      ...this.data.character, // Preserve all existing properties
      name: formValues.name,
      description: formValues.description,
      thumbnail: formValues.thumbnail,
      // Add any other form fields
    };

    // If editing, ensure ID is included
    if (this.data.mode === 'edit' && this.data.character) {
      characterData.id = this.data.character.id;
      characterData.modified = new Date().toISOString();
      // Preserve the source
      characterData.source = this.data.character.source;
    }

    // Add default properties for a new character
    if (this.data.mode === 'create') {
      characterData.comics = { available: 0, items: [], returned: 0, collectionURI: '' };
      characterData.series = { available: 0, items: [], returned: 0, collectionURI: '' };
      characterData.stories = { available: 0, items: [], returned: 0, collectionURI: '' };
      characterData.events = { available: 0, items: [], returned: 0, collectionURI: '' };
      characterData.urls = [];
      characterData.source = 'local';
    }

    this.dialogRef.close(characterData);
  }
}
}
