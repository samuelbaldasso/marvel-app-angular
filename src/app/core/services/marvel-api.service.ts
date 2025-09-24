import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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
          results: response.data.results,
          total: response.data.total
        }))
      );
  }

  getCharacterById(id: number): Observable<Character> {
    const params = this.getBaseParams();

    return this.http.get<any>(`${this.apiUrl}/characters/${id}`, { params })
      .pipe(
        map(response => response.data.results[0])
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

  /**
   * The following methods simulate CRUD operations that aren't supported by the Marvel API
   * In a real application with a writable API, these would actually perform HTTP requests
   */

  /**
   * Simulates creating a new character
   */
  createCharacter(character: Omit<Character, 'id'>): Observable<Character> {
    // Simulate API call with a local response
    return new Observable(observer => {
      setTimeout(() => {
        const newCharacter = {
          ...character,
          id: Math.floor(Math.random() * 1000000), // Generate fake ID
          modified: new Date().toISOString()
        } as Character;

        observer.next(newCharacter);
        observer.complete();
      }, 800); // Simulate network delay
    });
  }

  /**
   * Simulates updating a character
   */
  updateCharacter(character: Character): Observable<Character> {
    // Simulate API call with a local response
    return new Observable(observer => {
      setTimeout(() => {
        const updatedCharacter = {
          ...character,
          modified: new Date().toISOString()
        };

        observer.next(updatedCharacter);
        observer.complete();
      }, 800); // Simulate network delay
    });
  }

  /**
   * Simulates deleting a character
   */
  deleteCharacter(id: number): Observable<boolean> {
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
}
