import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, throwError, delay } from 'rxjs';
import { Character } from '../models/character.model';
import md5 from 'crypto-js/md5';
import { environment } from '../../../environments/env';

@Injectable({
  providedIn: 'root'
})
export class MarvelApiService {

  private apiUrl = 'https://gateway.marvel.com/v1/public';

  private ts = new Date().getTime().toString();

  private apiKey = environment.marvel.API_KEY;

  private privateKey = environment.marvel.PRIVATE_KEY;

  private hash = md5(`${this.ts}${this.privateKey}${this.apiKey}`).toString();

  constructor(private http: HttpClient) { }

  getCharacters(
    limit: number = 20,
    offset: number = 0,
    nameStartsWith?: string
  ): Observable<{ results: Character[], total: number }> {
    let params = this.getBaseParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    if (nameStartsWith) {
      params = params.set('nameStartsWith', nameStartsWith);
    }

    return this.http.get<any>(`${this.apiUrl}/characters`, { params })
      .pipe(
        map(response => ({
          results: response.data.results.map((char: any) => ({
            ...char,
            source: 'api' as const  // Mark API characters explicitly
          })),
          total: response.data.total
        }))
      );
  }

  getCharacterById(id: number): Observable<Character> {
    // First check local storage for this character
    const localChar = this.getCharacterFromLocalStorage(id);
    if (localChar) {
      return of(localChar); // Return the local character if found
    }

    // Otherwise get from API
    const params = this.getBaseParams();

    return this.http.get<any>(`${this.apiUrl}/characters/${id}`, { params })
      .pipe(
        map(response => ({
          ...response.data.results[0],
          source: 'api' as const  // Mark API character
        }))
      );
  }

  getCharacterComics(characterId: number, limit: number = 10): Observable<any[]> {
    const params = this.getBaseParams()
      .set('limit', limit.toString());

    return this.http.get<any>(`${this.apiUrl}/characters/${characterId}/comics`, { params })
      .pipe(
        map(response => response.data.results)
      );
  }

  createCharacter(character: Partial<Character>): Observable<Character> {
    const STORAGE_KEY = 'marvel_custom_characters';
    try {
      // Get existing characters
      const storedCharactersString = localStorage.getItem(STORAGE_KEY) || '[]';
      const storedCharacters = JSON.parse(storedCharactersString) as Character[];

      // Generate a unique ID (negative to avoid conflicts with API IDs)
      const nextId = this.generateUniqueLocalId(storedCharacters);

      // Create new character
      const newCharacter: Character = {
        ...(character as any),
        id: nextId,
        source: 'local'
      };

      // Add to storage
      storedCharacters.push(newCharacter);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedCharacters));

      return of(newCharacter);
    } catch (e) {
      return throwError(() => e);
    }
  }

  private generateUniqueLocalId(existingCharacters: Character[]): number {
  // Find the lowest (most negative) ID currently in use
  const lowestId = existingCharacters.reduce(
    (lowest, char) => (char.id < lowest && char.id < 0) ? char.id : lowest,
    -1
  );
  // Return one less (more negative) to ensure uniqueness
  return lowestId - 1;
}

  updateCharacter(character: Character): Observable<Character> {
    console.log('Service: updating character with ID:', character.id, character);

    // For local characters
    if (character.source === 'local' || this.isLocalCharacterId(character.id)) {
      return this.updateLocalCharacter(character);
    }

    // For API characters (simulated update)
    return of(character);
  }

  private updateLocalCharacter(character: Character): Observable<Character> {
    const STORAGE_KEY = 'marvel_custom_characters';
    try {
      // Get existing characters
      const storedCharactersString = localStorage.getItem(STORAGE_KEY) || '[]';
      const storedCharacters = JSON.parse(storedCharactersString) as Character[];

      // Check if character exists
      const index = storedCharacters.findIndex(c => c.id === character.id);

      if (index >= 0) {
        // Update existing character - preserve source property
        storedCharacters[index] = {
          ...character,
          source: storedCharacters[index].source // Ensure source remains consistent
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storedCharacters));
        return of(storedCharacters[index]).pipe(delay(100)); // Return the updated character
      }

      // Character not found, create a new entry
    const newCharacter = {
      ...character,
      source: 'local',
      modified: new Date().toISOString()
    } as Character;

    storedCharacters.push(newCharacter);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedCharacters));
    return of(newCharacter).pipe(delay(100));
    
  } catch (e) {
      console.error('Error updating local character:', e);
      return throwError(() => e);
    }
  }

// Simplified check - local characters have negative IDs
private isLocalCharacterId(id: number): boolean {
    return id < 0;
}

  /**
   * Simulates deleting a character
   */
  deleteCharacter(id: number): Observable<boolean> {
    // Check if it's a local character
    const localCharacter = this.getCharacterFromLocalStorage(id);

    if (localCharacter) {
      // Delete from local storage
      this.removeCharacterFromLocalStorage(id);
    } else {
      // Mark API character as deleted for future filtering
      this.markCharacterAsDeleted(id);
    }

    // Simulate API call
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(true); // Successful deletion
        observer.complete();
      }, 800); // Simulate network delay
    });
  }

  /**
   * Helper method to create base params required for every Marvel API request
   */
  private getBaseParams(): HttpParams {
    return new HttpParams()
      .set('apikey', this.apiKey!)
      .set('ts', this.ts)
      .set('hash', this.hash);
  }

  // Local storage helper methods
  private getCharacterFromLocalStorage(id: number): Character | null {
    const STORAGE_KEY = 'marvel_custom_characters';
    try {
      const storedCharacters = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Character[];
      return storedCharacters.find(char => char.id === id) || null;
    } catch (e) {
      console.error('Error retrieving character from local storage', e);
      return null;
    }
  }

  private saveCharacterToLocalStorage(character: Character): void {
    const STORAGE_KEY = 'marvel_custom_characters';
    try {
      // Get existing characters
      const storedCharactersString = localStorage.getItem(STORAGE_KEY) || '[]';
      const storedCharacters = JSON.parse(storedCharactersString) as Character[];

      // Update or add
      const existingIndex = storedCharacters.findIndex(c => c.id === character.id);
      if (existingIndex >= 0) {
        storedCharacters[existingIndex] = character;
      } else {
        storedCharacters.push(character);
      }

      // Save back
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedCharacters));
    } catch (e) {
      console.error('Error saving character to local storage', e);
    }
  }

  private removeCharacterFromLocalStorage(id: number): void {
    const STORAGE_KEY = 'marvel_custom_characters';
    try {
      const storedCharactersString = localStorage.getItem(STORAGE_KEY) || '[]';
      let storedCharacters = JSON.parse(storedCharactersString) as Character[];

      // Filter out the character
      storedCharacters = storedCharacters.filter(c => c.id !== id);

      // Save back
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedCharacters));
    } catch (e) {
      console.error('Error removing character from local storage', e);
    }
  }

  private markCharacterAsDeleted(id: number): void {
    const DELETED_KEY = 'marvel_deleted_characters';
    try {
      const deletedIdsString = localStorage.getItem(DELETED_KEY) || '[]';
      const deletedIds = JSON.parse(deletedIdsString) as number[];

      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem(DELETED_KEY, JSON.stringify(deletedIds));
      }
    } catch (e) {
      console.error('Error marking character as deleted', e);
    }
  }

}
