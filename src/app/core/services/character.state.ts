import { Injectable, computed, effect, signal, OnDestroy, inject } from '@angular/core';
import { Character, CharacterFilter, PaginationInfo } from '../models/character.model';
import { MarvelApiService } from './marvel-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class CharacterState implements OnDestroy {
  // Crie um BehaviorSubject para gerenciar o estado dos personagens
  private charactersSubject = new BehaviorSubject<Character[]>([]);

  private localStorageService = inject(LocalStorageService);
  // Exponha o Observable para componentes externos observarem
  public characters$ = this.charactersSubject.asObservable();

  public selectedCharacter$ = new BehaviorSubject<Character | null>(null);

  private destroy$ = new Subject<void>();

  // Flag to prevent automatic reload when navigating back
  private skipNextAutoLoad = false;

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
    // On first load, ensure we have all local characters
    this.loadInitialCharacters();

    // Setup an effect to reload characters when filters change
    effect(() => {
      const filter = this.filterSignal();

      if (this.skipNextAutoLoad) {
        this.skipNextAutoLoad = false;
        return;
      }

      this.loadCharacters();
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Search state persistence
  private readonly SEARCH_STATE_KEY = 'marvel_search_state';

  /**
   * Save current search state to session storage
   */
  saveSearchState(): void {
    const currentFilter = this.filterSignal();
    sessionStorage.setItem(this.SEARCH_STATE_KEY, JSON.stringify({
      nameStartsWith: currentFilter.nameStartsWith,
      offset: currentFilter.offset,
      limit: currentFilter.limit
    }));
  }

  /**
   * Restore search state from session storage
   */
  restoreSearchState(): boolean {
    const savedState = sessionStorage.getItem(this.SEARCH_STATE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        this.filterSignal.set({
          nameStartsWith: parsedState.nameStartsWith || '',
          offset: parsedState.offset || 0,
          limit: parsedState.limit || 20
        });
        return true;
      } catch (e) {
        console.error('Error restoring search state', e);
      }
    }
    return false;
  }

  /**
   * Clear saved search state
   */
  clearSavedSearchState(): void {
    sessionStorage.removeItem(this.SEARCH_STATE_KEY);
  }

  /**
   * Load both local and API characters on first load
   */
  private loadInitialCharacters(): void {
    // Get local characters from storage
    const localCharacters = this.getLocalCharacters();

    // If we have local characters, set them first
    if (localCharacters.length > 0) {
      this.charactersSignal.set(localCharacters);
    }

    // Then load API characters to complement locals
    this.loadCharacters();
  }

  private getLocalCharacters(): Character[] {
    const STORAGE_KEY = 'marvel_custom_characters';
    try {
      const storedCharactersString = localStorage.getItem(STORAGE_KEY);
      if (!storedCharactersString) return [];

      const storedCharacters = JSON.parse(storedCharactersString) as Character[];
      return storedCharacters.map(char => ({
        ...char,
        source: 'local' as const
      }));
    } catch (e) {
      console.error('Error getting local characters', e);
      return [];
    }
  }

  /**
   * Set flag to skip next automatic load (use when navigating)
   */
  skipNextLoad(): void {
    this.skipNextAutoLoad = true;
  }

  /**
   * Add a local character to the state
   */
  addLocalCharacter(character: Character): void {
    // Make sure we mark it as local
    const localCharacter = {
      ...character,
      source: 'local' as const
    };

    this.charactersSignal.update(characters => {
      // Check if character already exists
      const exists = characters.some(c => c.id === localCharacter.id);
      if (exists) {
        // Replace existing character
        return characters.map(c => c.id === localCharacter.id ? localCharacter : c);
      } else {
        // Add new character at the beginning
        return [localCharacter, ...characters];
      }
    });
  }

  /**
   * Load characters based on current filter
   */
  loadCharacters(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    // Get local characters first
    const localCharacters = this.getLocalCharacters();

    // Create a set of local IDs to prevent duplicates
    const localIds = new Set(localCharacters.map(c => c.id));

    const { nameStartsWith, limit, offset } = this.filterSignal();

    // Filter local characters by search term if needed
    let filteredLocalChars = localCharacters;
    if (nameStartsWith) {
      const searchTerm = nameStartsWith.toLowerCase();
      filteredLocalChars = localCharacters.filter(
        char => char.name.toLowerCase().includes(searchTerm)
      );
    }

    this.marvelService.getCharacters(limit!, offset!, nameStartsWith)
      .subscribe({
        next: (response) => {
          // Filter out any API characters that duplicate local ones
          const apiResults = response.results.filter(char => !localIds.has(char.id));

          // Combine local and API characters with locals first
          this.charactersSignal.set([...filteredLocalChars, ...apiResults]);

          // Update pagination accounting for local characters
          this.paginationSignal.set({
            total: response.total + filteredLocalChars.length,
            count: apiResults.length + filteredLocalChars.length,
            limit: limit!,
            offset: offset!
          });

          this.loadingSignal.set(false);
        },
        error: (error) => {
          console.error('Error loading characters', error);

          // If API fails, still show local characters
          if (filteredLocalChars.length > 0) {
            this.charactersSignal.set(filteredLocalChars);
            this.paginationSignal.set({
              total: filteredLocalChars.length,
              count: filteredLocalChars.length,
              limit: limit!,
              offset: 0
            });
            this.errorSignal.set('Failed to load API characters. Showing local characters only.');
          } else {
            this.errorSignal.set('Failed to load characters. Please try again.');
          }

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

    // Get local characters that should stay at the top
    const localChars = currentChars.filter(c => c.source === 'local');
    // Create a set of local IDs to prevent duplicates
    const localIds = new Set(localChars.map(c => c.id));

    this.loadingSignal.set(true);

    this.marvelService.getCharacters(
      currentFilter.limit!,
      newOffset,
      currentFilter.nameStartsWith
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Filter out any characters that would duplicate locals
          const newApiChars = response.results.filter(char => !localIds.has(char.id));

          // Get the current API characters (non-local)
          const currentApiChars = currentChars.filter(c => c.source !== 'local');

          // Combine all characters: local first, then current API, then new API
          this.charactersSignal.set([
            ...localChars,
            ...currentApiChars,
            ...newApiChars
          ]);

          // Update pagination info
          this.paginationSignal.set({
            total: response.total + localChars.length,
            count: currentChars.length + newApiChars.length,
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

    // Check local characters first (the service will do this now)
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

    // The MarvelApiService now handles saving to localStorage
    this.marvelService.createCharacter(character)
      .subscribe({
        next: (newCharacter) => {
          // Add at the beginning of the list
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

  updateCharacter(character: Character): void {
  this.loadingSignal.set(true);
  this.errorSignal.set(null);

  // Make sure we preserve the ID and source
  const characterToUpdate = {
    ...character,
    source: character.source || 
      (this.isLocalCharacterId(character.id) ? 'local' : 'api')
  };

  // Log for debugging
  console.log('Updating character:', characterToUpdate);

  this.marvelService.updateCharacter(characterToUpdate)
    .subscribe({
      next: (updatedCharacter) => {
        console.log('Character updated:', updatedCharacter);
        
        // Update in the list - ensure consistent update
        this.charactersSignal.update(characters => {
          return characters.map(c => {
            if (c.id === updatedCharacter.id) {
              // Preserve source information when updating
              return {
                ...updatedCharacter,
                source: characterToUpdate.source
              };
            }
            return c;
          });
        });

        // Update selected character if it's the one being edited
        if (this.selectedCharacterSignal()?.id === updatedCharacter.id) {
          this.selectedCharacterSignal.set({
            ...updatedCharacter,
            source: characterToUpdate.source
          });
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

  private isLocalCharacterId(id: number): boolean {
    const STORAGE_KEY = 'marvel_custom_characters';
    try {
      const storedCharactersString = localStorage.getItem(STORAGE_KEY);
      if (!storedCharactersString) return false;

      const storedCharacters = JSON.parse(storedCharactersString) as Character[];
      return storedCharacters.some(char => char.id === id);
    } catch (e) {
      console.error('Error checking local character', e);
      return false;
    }
  }

  /**
   * Save a character to local storage
   */
  private saveToLocalStorage(character: Character): void {
    const STORAGE_KEY = 'marvel_custom_characters';
    try {
      // Get existing characters
      const storedCharactersString = localStorage.getItem(STORAGE_KEY) || '[]';
      const storedCharacters = JSON.parse(storedCharactersString) as Character[];

      // Update or add the character
      const index = storedCharacters.findIndex(c => c.id === character.id);
      if (index >= 0) {
        storedCharacters[index] = {
          ...character,
          source: 'local' as const  // Always ensure source is set
        };
      } else {
        storedCharacters.push({
          ...character,
          source: 'local' as const
        });
      }

      // Save back to storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedCharacters));
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }

  /**
   * Delete a character (simulated)
   */
  deleteCharacter(id: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    // The MarvelApiService now handles removing from localStorage or marking as deleted
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

  /**
   * Force reload all characters
   */
  reloadCharacters(): void {
    // First refresh local characters
    const localChars = this.getLocalCharacters();

    // Then reload from API
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const { nameStartsWith, limit, offset } = this.filterSignal();
    const localIds = new Set(localChars.map(c => c.id));

    this.marvelService.getCharacters(limit!, offset!, nameStartsWith)
      .subscribe({
        next: (response) => {
          // Filter API results to avoid duplicates
          const apiChars = response.results.filter(c => !localIds.has(c.id));

          // Set combined results with locals first
          this.charactersSignal.set([...localChars, ...apiChars]);

          this.paginationSignal.set({
            total: response.total + localChars.length,
            count: apiChars.length + localChars.length,
            limit: limit!,
            offset: offset!
          });

          this.loadingSignal.set(false);
        },
        error: (error) => {
          console.error('Error reloading characters', error);

          // If API fails, still show local characters
          if (localChars.length > 0) {
            this.charactersSignal.set(localChars);
            this.paginationSignal.set({
              total: localChars.length,
              count: localChars.length,
              limit: limit!,
              offset: 0
            });
            this.errorSignal.set('Failed to load API characters. Showing local characters only.');
          } else {
            this.errorSignal.set('Failed to load characters. Please try again.');
          }

          this.loadingSignal.set(false);
        }
      });
  }

  /**
 * Clear the search filter and reset to initial state
 */
  clearSearchFilter(): void {
    this.filterSignal.update(filter => ({
      ...filter,
      nameStartsWith: '',
      offset: 0
    }));

    // Force a reload to show all characters
    this.loadCharacters();
  }

  // Método para buscar personagens com um termo de pesquisa
  searchCharacters(term: string): void {
    // Por exemplo, usando o serviço da API com o termo de pesquisa
    this.marvelService.getCharacters(20, 0, term).subscribe(apiResponse => {
      const apiCharacters = apiResponse.results.filter(char =>
        !this.localStorageService.isCharacterDeleted(char.id)
      );

      // Buscar personagens locais que correspondam ao termo
      const localCharacters = this.localStorageService.getLocalCharacters()
        .filter(char => char.name.toLowerCase().includes(term.toLowerCase()));

      // Combine os resultados e atualize o estado
      this.charactersSubject.next([...apiCharacters, ...localCharacters]);
    });
  }
}
