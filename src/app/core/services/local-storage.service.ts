// src/app/core/services/local-storage.service.ts
import { Injectable } from '@angular/core';

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
}
