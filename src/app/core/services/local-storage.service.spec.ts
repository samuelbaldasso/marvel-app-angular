import { TestBed } from '@angular/core/testing';
import { LocalStorageService } from './local-storage.service';
import { Character } from '../models/character.model';

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let storageMock: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    storageMock = {};

    spyOn(localStorage, 'getItem').and.callFake(key => storageMock[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key, value) => storageMock[key] = value);
    spyOn(localStorage, 'removeItem').and.callFake(key => delete storageMock[key]);

    TestBed.configureTestingModule({
      providers: [LocalStorageService]
    });

    service = TestBed.inject(LocalStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getLocalCharacters', () => {
    it('should return an empty array when no characters exist', () => {
      const characters = service.getLocalCharacters();
      expect(characters).toEqual([]);
      expect(localStorage.getItem).toHaveBeenCalledWith('marvel_custom_characters');
    });

    it('should return characters from local storage when they exist', () => {
      const mockCharacters = [
        { id: 1, name: 'Custom Character 1', source: 'local' },
        { id: 2, name: 'Custom Character 2', source: 'local' }
      ];

      storageMock['marvel_custom_characters'] = JSON.stringify(mockCharacters);

      const characters = service.getLocalCharacters();
      expect(characters).toEqual(mockCharacters as Character[]);
      expect(localStorage.getItem).toHaveBeenCalledWith('marvel_custom_characters');
    });

    it('should handle JSON parsing errors', () => {
      storageMock['marvel_custom_characters'] = 'invalid-json';

      const characters = service.getLocalCharacters();
      expect(characters).toEqual([]);
    });
  });

  describe('getCharacterFromLocalStorage', () => {
    it('should return null when character does not exist', () => {
      const character = service.getCharacterFromLocalStorage(1);
      expect(character).toBeNull();
    });

    it('should return character when it exists', () => {
      const mockCharacters = [
        { id: 1, name: 'Custom Character 1', source: 'local' },
        { id: 2, name: 'Custom Character 2', source: 'local' }
      ];

      storageMock['marvel_custom_characters'] = JSON.stringify(mockCharacters);

      const character = service.getCharacterFromLocalStorage(1);
      expect(character).toEqual(mockCharacters[0] as Character);
    });
  });

  describe('saveLocalCharacter', () => {
    it('should add a new character when it does not exist', () => {
      const newCharacter = { id: 1, name: 'New Character', source: 'local' } as Character;
      service.saveCharacterToLocalStorage(newCharacter);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'marvel_custom_characters',
        JSON.stringify([newCharacter])
      );
    });

    it('should update an existing character', () => {
      const existingCharacters = [
        { id: 1, name: 'Old Name', source: 'local' }
      ];
      storageMock['marvel_custom_characters'] = JSON.stringify(existingCharacters);

      const updatedCharacter = { id: 1, name: 'Updated Name', source: 'local' } as Character;
      service.saveCharacterToLocalStorage(updatedCharacter);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'marvel_custom_characters',
        JSON.stringify([updatedCharacter])
      );
    });
  });

  describe('removeLocalCharacter', () => {
    it('should remove a character if it exists', () => {
      const mockCharacters = [
        { id: 1, name: 'Character 1', source: 'local' },
        { id: 2, name: 'Character 2', source: 'local' }
      ];
      storageMock['marvel_custom_characters'] = JSON.stringify(mockCharacters);

      service.removeCharacterFromLocalStorage(1);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'marvel_custom_characters',
        JSON.stringify([mockCharacters[1]])
      );
    });
  });

  describe('isCharacterDeleted', () => {
    it('should return true for deleted character IDs', () => {
      storageMock['marvel_deleted_characters'] = JSON.stringify([1, 3, 5]);

      expect(service.isCharacterDeleted(1)).toBe(true);
      expect(service.isCharacterDeleted(3)).toBe(true);
      expect(service.isCharacterDeleted(5)).toBe(true);
    });

    it('should return false for non-deleted character IDs', () => {
      storageMock['marvel_deleted_characters'] = JSON.stringify([1, 3, 5]);

      expect(service.isCharacterDeleted(2)).toBe(false);
      expect(service.isCharacterDeleted(4)).toBe(false);
    });

    it('should return false when no deleted IDs exist', () => {
      // Garantir que não há dados armazenados
      delete storageMock['marvel_deleted_characters'];

      expect(service.isCharacterDeleted(1)).toBe(false);
    });
  });

  describe('markCharacterAsDeleted', () => {
    it('should add ID to deleted characters list', () => {
      storageMock['marvel_deleted_characters'] = JSON.stringify([1, 2, 3]);

      service.markCharacterAsDeleted(4);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'marvel_deleted_characters',
        JSON.stringify([1, 2, 3, 4])
      );
    });
  });
});
