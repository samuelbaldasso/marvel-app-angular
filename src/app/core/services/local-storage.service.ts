// src/app/core/services/local-storage.service.ts
import { Injectable } from '@angular/core';
import { Character } from '../models/character.model';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  /**
   * Get item from localStorage
   */
  getItem<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (item !== null) {
      try {
        return JSON.parse(item) as T;
      } catch (e) {
        console.error('Error parsing stored JSON', e);
        return null;
      }
    }
    return null;
  }

  /**
   * Save item to localStorage
   */
  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Error saving to localStorage', e);

      // If storage is full, show error
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded');
      }
    }
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clear all data in localStorage
   */
  clear(): void {
    localStorage.clear();
  }

  /**
   * Marca um personagem como excluído salvando seu ID em localStorage
   */
  markCharacterAsDeleted(id: number): void {
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

  saveCharacterToLocalStorage(character: Character): void {
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

  /**
   * Verifica se um personagem foi marcado como excluído
   * @param id O ID do personagem a verificar
   * @returns true se o personagem estiver na lista de excluídos
   */
  isCharacterDeleted(id: number): boolean {
    const DELETED_KEY = 'marvel_deleted_characters';
    try {
      const deletedIdsString = localStorage.getItem(DELETED_KEY);
      if (!deletedIdsString) {
        return false;
      }

      const deletedIds = JSON.parse(deletedIdsString) as number[];
      return deletedIds.includes(id);
    } catch (e) {
      console.error('Error checking if character is deleted', e);
      return false;
    }
  }

   removeCharacterFromLocalStorage(id: number): void {
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

  getLocalCharacters(): Character[] {
    const STORAGE_KEY = 'marvel_custom_characters';
    try {
      const storedCharactersString = localStorage.getItem(STORAGE_KEY) || '[]';
      return JSON.parse(storedCharactersString) as Character[];
    } catch (e) {
      console.error('Error retrieving characters from local storage', e);
      return [];
    }
  }

  getCharacterFromLocalStorage(id: number): Character | null {
    const STORAGE_KEY = 'marvel_custom_characters';
    try {
      const storedCharacters = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Character[];
      return storedCharacters.find(char => char.id === id) || null;
    } catch (e) {
      console.error('Error retrieving character from local storage', e);
      return null;
    }
  }
}
