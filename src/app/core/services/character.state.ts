import { Injectable, computed, effect, signal, OnDestroy } from '@angular/core';
import { Character, CharacterFilter, PaginationInfo } from '../models/character.model';
import { MarvelApiService } from './marvel-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CharacterState implements OnDestroy {
  private destroy$ = new Subject<void>();

  // State signals
  private charactersSignal = signal<Character[]>([]);
  private selectedCharacterSignal = signal<Character | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private paginationSignal = signal<PaginationInfo>({
    total: 0,
    count: 0,
    limit: 20,
    offset: 0
  });
  private filterSignal = signal<CharacterFilter>({
    nameStartsWith: '',
    limit: 20,
    offset: 0
  });

  // Public readable signals
  readonly characters = this.charactersSignal.asReadonly();
  readonly selectedCharacter = this.selectedCharacterSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();
  readonly filter = this.filterSignal.asReadonly();

  // Computed signals
  readonly hasMore = computed(() => {
    const p = this.paginationSignal();
    return p.offset + p.count < p.total;
  });

  readonly isEmpty = computed(() => this.charactersSignal().length === 0);

  readonly totalPages = computed(() => {
    const p = this.paginationSignal();
    return Math.ceil(p.total / p.limit);
  });

  readonly currentPage = computed(() => {
    const p = this.paginationSignal();
    return Math.floor(p.offset / p.limit) + 1;
  });

  constructor(private marvelService: MarvelApiService) {
    // Load initial data
    this.loadCharacters();

    // Setup an effect to reload characters when filters change
    effect(() => {
      const filter = this.filterSignal();
      this.loadCharacters();
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Add a local character to the state
   */
  addLocalCharacter(character: Character): void {
    this.charactersSignal.update(characters => {
      // Add the local character to the array
      return [...characters, character];
    });
  }
  /**
   * Load characters based on current filter
   */
  loadCharacters(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const { nameStartsWith, limit, offset } = this.filterSignal();
      this.marvelService.getCharacters(limit!, offset!, nameStartsWith)
      .subscribe({
        next: (response) => {
          this.charactersSignal.set(response.results);
          this.paginationSignal.set({
            total: response.total,
            count: response.results.length,
            limit: limit!,
            offset: offset!
          });
          this.loadingSignal.set(false);
        },
        error: (error) => {
          console.error('Error loading characters', error);
          this.errorSignal.set('Failed to load characters. Please try again.');
          this.loadingSignal.set(false);
        }
      });
  }

  /**
   * Load more characters (for infinite scroll)
   */
  loadMoreCharacters(): void {
    if (!this.hasMore()) return;

    const currentFilter = this.filterSignal();
    const currentChars = this.charactersSignal();
    const newOffset = (currentFilter.offset || 0) + (currentFilter.limit || 24);
    this.loadingSignal.set(true);
    this.marvelService.getCharacters(
      currentFilter.limit!,
      newOffset,
      currentFilter.nameStartsWith
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Append new characters to existing ones
          this.charactersSignal.set([...currentChars, ...response.results]);
          // Update pagination info
          this.paginationSignal.set({
            total: response.total,
            count: currentChars.length + response.results.length,
            limit: currentFilter.limit!,
            offset: newOffset
          });

          // Update filter to match new offset
          this.filterSignal.update(filter => ({
            ...filter,
            offset: newOffset
          }));
          this.loadingSignal.set(false);
        },
        error: (error) => {
          console.error('Error loading more characters', error);
          this.errorSignal.set('Failed to load more characters. Please try again.');
          this.loadingSignal.set(false);
        }
      });
  }

  /**
   * Set search filter
   */
  setNameFilter(name: string): void {
    this.filterSignal.update(filter => ({
      ...filter,
      nameStartsWith: name,
      offset: 0 // Reset offset when filter changes
    }));
  }
  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.hasMore()) {
      this.filterSignal.update(filter => ({
        ...filter,
        offset: (filter.offset || 0) + (filter.limit || 20)
      }));
    }
  }
  /**
   * Go to previous page
   */
  previousPage(): void {
    this.filterSignal.update(filter => ({
      ...filter,
      offset: Math.max(0, (filter.offset || 0) - (filter.limit || 20))
    }));
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): void {
    const limit = this.filterSignal().limit || 20;
    this.filterSignal.update(filter => ({
      ...filter,
      offset: (page - 1) * limit
    }));
  }

  /**
   * Load a specific character by ID
   */
  loadCharacter(id: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.marvelService.getCharacterById(id)
      .subscribe({
        next: (character) => {
          this.selectedCharacterSignal.set(character);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          console.error('Error loading character', error);
          this.errorSignal.set('Failed to load character details.');
          this.loadingSignal.set(false);
        }
      });
  }

  /**
   * Create a new character (simulated)
   */
  createCharacter(character: Omit<Character, 'id'>): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.marvelService.createCharacter(character)
      .subscribe({
        next: (newCharacter) => {
          this.charactersSignal.update(characters => [newCharacter, ...characters]);
          this.selectedCharacterSignal.set(newCharacter);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          console.error('Error creating character', error);
          this.errorSignal.set('Failed to create character.');
          this.loadingSignal.set(false);
        }
      });
  }

  /**
   * Update an existing character (simulated)
   */
  updateCharacter(character: Character): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.marvelService.updateCharacter(character)
      .subscribe({
        next: (updatedCharacter) => {
          // Update in the list
          this.charactersSignal.update(characters =>
            characters.map(c => c.id === updatedCharacter.id ? updatedCharacter : c)
          );

          // Update selected character if it's the one being edited
          if (this.selectedCharacterSignal()?.id === updatedCharacter.id) {
            this.selectedCharacterSignal.set(updatedCharacter);
          }

          this.loadingSignal.set(false);
        },
        error: (error) => {
          console.error('Error updating character', error);
          this.errorSignal.set('Failed to update character.');
          this.loadingSignal.set(false);
        }
      });
  }

  /**
   * Delete a character (simulated)
   */
  deleteCharacter(id: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.marvelService.deleteCharacter(id)
      .subscribe({
        next: (_) => {
          // Remove from list
          this.charactersSignal.update(characters =>
            characters.filter(c => c.id !== id)
          );

          // Clear selected character if it's the one being deleted
          if (this.selectedCharacterSignal()?.id === id) {
            this.selectedCharacterSignal.set(null);
          }

          this.loadingSignal.set(false);
        },
        error: (error) => {
          console.error('Error deleting character', error);
          this.errorSignal.set('Failed to delete character.');
          this.loadingSignal.set(false);
        }
      });
  }

  /**
   * Clear the selected character
   */
  clearSelectedCharacter(): void {
    this.selectedCharacterSignal.set(null);
  }
}
