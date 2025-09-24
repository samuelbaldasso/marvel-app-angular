// src/app/features/characters/pages/character-list/character-list.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CharacterState } from '../../../../core/services/character.state';
import { CharacterCardComponent } from '../../components/character-card/character-card.component';
import { Character } from '../../../../core/models/character.model';
import { CharacterFormDialogComponent } from '../../components/character-form-dialog/character-form-dialog.component';
import { LocalStorageService } from '../../../../core/services/local-storage.service';

@Component({
  selector: 'app-character-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatDialogModule,
    CharacterCardComponent,
  ],
  templateUrl: './character-list.component.html',
  styleUrl: './character-list.component.scss'
})
export class CharacterListComponent implements OnInit {
  private characterState = inject(CharacterState);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private storageService = inject(LocalStorageService);

  // Local character storage key
  private readonly STORAGE_KEY = 'marvel_custom_characters';

  // Expose state to the template
  readonly characters = this.characterState.characters;
  readonly loading = this.characterState.loading;
  readonly error = this.characterState.error;
  readonly pagination = this.characterState.pagination;
  readonly isEmpty = this.characterState.isEmpty;
  readonly currentPage = this.characterState.currentPage;
  readonly totalPages = this.characterState.totalPages;

  // Search handling
  searchTerm = '';
  private searchSubject = new Subject<string>();

  constructor() {
    // Setup search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(term => {
      this.characterState.setNameFilter(term);
    });
  }

  ngOnInit(): void {
      // Initialize search term from state
  this.searchTerm = this.characterState.filter().nameStartsWith || '';
  
    // Load locally stored characters on component initialization
    this.loadLocalCharacters();
  }

  /**
   * Load characters from local storage and merge with API data
   */
  private loadLocalCharacters(): void {
    const storedCharacters = this.storageService.getItem<Character[]>(this.STORAGE_KEY) || [];

    if (storedCharacters.length > 0) {
      // Add local characters to state
      storedCharacters.forEach(character => {
        // Mark character as local
        character.source = 'local';
        this.characterState.addLocalCharacter(character);
      });

      this.snackBar.open(`Loaded ${storedCharacters.length} locally stored characters`, 'Close', {
          duration: 3000
        });
    }
  }

  /**
 * Clear search term and show all characters
 */
clearSearch(): void {
  this.searchTerm = '';
  this.characterState.clearSearchFilter();
}


  /**
   * Save characters to local storage
   */
  private saveToLocalStorage(character: Character): void {
    // Get current stored characters
    let storedCharacters = this.storageService.getItem<Character[]>(this.STORAGE_KEY) || [];

    // Check if character already exists
    const existingIndex = storedCharacters.findIndex(c => c.id === character.id);

    if (existingIndex >= 0) {
      // Update existing character
      storedCharacters[existingIndex] = character;
      } else {
      // Add new character with generated ID if needed
      if (!character.id) {
        character.id = Date.now(); // Simple ID generation
        }
      storedCharacters.push(character);
      }

    // Save updated list
    this.storageService.setItem(this.STORAGE_KEY, storedCharacters);
  }

  /**
   * Remove character from local storage
   */
  private removeFromLocalStorage(characterId: number): void {
    let storedCharacters = this.storageService.getItem<Character[]>(this.STORAGE_KEY) || [];
    storedCharacters = storedCharacters.filter(c => c.id !== characterId);
    this.storageService.setItem(this.STORAGE_KEY, storedCharacters);
  }
  // Reload characters in case of error
  reloadCharacters(): void {
    this.characterState.loadCharacters();
    this.loadLocalCharacters(); // Also reload local characters
  }

  // Handler for the search input
  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  // Pagination handler
  onPageChange(event: PageEvent): void {
    // PageIndex is 0-based, but our page numbers are 1-based
    this.characterState.goToPage(event.pageIndex + 1);
  }

  /**
   * Navigate back to character list
   */
  navigateToList(): void {
    this.router.navigate(['/characters']);
  }

// Character selection handler
viewCharacterDetails(character: Character): void {
  // Save current search state before navigating
  this.characterState.saveSearchState();
  this.router.navigate(['/characters', character.id]);
}


  // Create new character
  createNewCharacter(): void {
    this.openCreateCharacterDialog();
  }

  /**
   * Open dialog to create new character
   */
  openCreateCharacterDialog(): void {
    const dialogRef = this.dialog.open(CharacterFormDialogComponent, {
      width: '600px',
       data: {
        mode: 'create',
        character: null
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Mark as local character
        result.source = 'local';

        // Add to state
        this.characterState.createCharacter(result);

        // Save to local storage
        this.saveToLocalStorage(result);
        this.snackBar.open('Character created and saved locally!', 'Close', {
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

  // Delete character with confirmation
  deleteCharacter(character: Character, event: Event): void {
    // Stop event propagation to prevent navigation
    event.stopPropagation();

    if (confirm(`Are you sure you want to delete ${character.name}?`)) {
      this.characterState.deleteCharacter(character.id);

      // If it's a local character, also remove from storage
      if (character.source === 'local') {
        this.removeFromLocalStorage(character.id);
      }

      this.snackBar.open(`${character.name} deleted`, 'Close', {
        duration: 3000,
      });
    }
  }

  /**
   * Export all local characters to JSON file
   */
  exportLocalCharacters(): void {
    const storedCharacters = this.storageService.getItem<Character[]>(this.STORAGE_KEY) || [];
    if (storedCharacters.length === 0) {
      this.snackBar.open('No local characters to export', 'Close', {
        duration: 2000
      });
      return;
    }

    const dataStr = JSON.stringify(storedCharacters);
    const dataUri = 'application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileName = 'marvel_characters_' + new Date().toISOString() + '.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  }
}
