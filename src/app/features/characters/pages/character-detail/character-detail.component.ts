// src/app/features/characters/pages/character-detail/character-detail.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { CharacterState } from '../../../../core/services/character.state';
import { ThumbnailPipe } from '../../../../shared/pipes/thumbnail.pipe';
import { CharacterFormDialogComponent } from '../../components/character-form-dialog/character-form-dialog.component';

@Component({
  selector: 'app-character-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
],
  templateUrl: 'character-detail.component.html',
  styleUrls: ['character-detail.component.scss']
})
export class CharacterDetailComponent implements OnInit {
  private characterState = inject(CharacterState);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Expose state to the template
  readonly character = this.characterState.selectedCharacter;
  readonly loading = this.characterState.loading;
  readonly error = this.characterState.error;

  ngOnInit(): void {
    // Get character ID from route parameters
    const id = this.route.snapshot.paramMap.get('id');

    if (id === 'new') {
      // Handle "new" character case
      this.openCreateCharacterDialog();
    } else if (id) {
      // Load existing character
      const characterId = parseInt(id, 10);
      if (!isNaN(characterId)) {
        this.loadCharacter(characterId);
      } else {
        this.navigateToList();
      }
    } else {
      this.navigateToList();
    }
  }

  /**
   * Load character details
   */
  loadCharacter(id: number): void {
    this.characterState.loadCharacter(id);
  }

  /**
   * Navigate back to character list
   */
  navigateToList(): void {
    this.router.navigate(['/characters']);
  }

  /**
   * Open dialog to edit character
   */
  editCharacter(): void {
    const currentCharacter = this.character();

    if (!currentCharacter) {
      return;
    }

    const dialogRef = this.dialog.open(CharacterFormDialogComponent, {
      width: '600px',
      data: { // This was the issue - '' was missing
        mode: 'edit',
        character: currentCharacter
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.characterState.updateCharacter(result);
        this.snackBar.open('Character updated successfully!', 'Close', {
          duration: 3000
        });
      }
    });
  }

  /**
   * Open dialog to create new character
   */
  openCreateCharacterDialog(): void {
    const dialogRef = this.dialog.open(CharacterFormDialogComponent, {
      width: '600px',
      data: { // This was the issue - '' was missing
        mode: 'create',
        character: null
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.characterState.createCharacter(result);
        this.snackBar.open('Character created successfully!', 'Close', {
          duration: 3000
        });
        // Navigate to the list after creation
        this.navigateToList();
      } else {
        // If dialog was cancelled and we were in "new" mode, go back to list
        if (this.route.snapshot.paramMap.get('id') === 'new') {
          this.navigateToList();
        }
      }
    });
  }

  /**
   * Delete current character
   */
  deleteCharacter(): void {
    const currentCharacter = this.character();

    if (!currentCharacter) {
      return;
    }

    if (confirm(`Are you sure you want to delete ${currentCharacter.name}?`)) {
      this.characterState.deleteCharacter(currentCharacter.id);
      this.snackBar.open(`${currentCharacter.name} deleted`, 'Close', {
        duration: 3000
      });
      this.navigateToList();
    }
  }

  /**
   * Get full thumbnail URL
   */
  getThumbnailUrl(): string {
    const char = this.character();
    if (!char?.thumbnail) {
      return 'assets/images/image-not-available.jpg';
    }

    return `${char.thumbnail.path}/portrait_uncanny.${char.thumbnail.extension}`;
  }

  /**
   * Reload character from API if needed
   */
  reloadCharacter(): void {
    const currentCharacter = this.character();
    if (currentCharacter) {
      this.loadCharacter(currentCharacter.id);
    }
  }
}
