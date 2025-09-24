import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MarvelApiService } from './marvel-api.service';
import { Character } from '../models/character.model';
import { of } from 'rxjs';

describe('MarvelApiService', () => {
  let service: MarvelApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MarvelApiService]
    });

    service = TestBed.inject(MarvelApiService);
    httpMock = TestBed.inject(HttpTestingController);

    // Mock environment values
    (service as any).apiUrl = 'https://gateway.marvel.com/v1/public';
    (service as any).apiKey = 'test-api-key';
    (service as any).ts = '1';
    (service as any).hash = 'test-hash';

    // Mock localStorage
    spyOn(localStorage, 'getItem').and.callFake((key) => {
      if (key === 'marvel_custom_characters') {
        return JSON.stringify([
          {
            id: 999,
            name: 'Local Hero',
            description: 'A local character',
            source: 'local',
            modified: new Date().toISOString(),
            thumbnail: { path: 'http://local', extension: 'jpg' }
          }
        ]);
      }
      if (key === 'marvel_deleted_characters') {
        return JSON.stringify([123]);
      }
      return null;
    });

    spyOn(localStorage, 'setItem').and.stub();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCharacters', () => {
    it('should get characters with correct parameters', () => {
      const mockResponse = {
         data: {
          results: [
            { id: 1, name: 'Spider-Man', description: 'Web slinger' },
            { id: 2, name: 'Iron Man', description: 'Genius billionaire' }
          ],
          total: 2
        }
      };

      service.getCharacters(20, 0).subscribe(characters => {
        expect(characters.results.length).toBe(2);
        expect(characters.results[0].name).toBe('Spider-Man');
        expect(characters.results[0].source).toBe('api');
        expect(characters.total).toBe(2);
      });

      const req = httpMock.expectOne(request => {
        return request.url === 'https://gateway.marvel.com/v1/public/characters' &&
               request.params.get('limit') === '20' &&
               request.params.get('offset') === '0' &&
               request.params.get('apikey') === 'test-api-key';
      });

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include nameStartsWith param when provided', () => {
      const mockResponse = {
         data: {
          results: [{ id: 1, name: 'Spider-Man', description: 'Web slinger' }],
          total: 1
        }
      };

      service.getCharacters(20, 0, 'Spider').subscribe();

      const req = httpMock.expectOne(request => {
        return request.url === 'https://gateway.marvel.com/v1/public/characters' &&
              request.params.get('nameStartsWith') === 'Spider';
      });

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getCharacterById', () => {
    it('should return character from local storage if available', () => {
      service.getCharacterById(999).subscribe(char => {
        expect(char.name).toBe('Local Hero');
        expect(char.source).toBe('local');
      });

      // No HTTP request should be made
      httpMock.expectNone(`https://gateway.marvel.com/v1/public/characters/999`);
    });

    it('should fetch character from API if not in local storage', () => {
      const mockResponse = {
         data: {
          results: [{ id: 123, name: 'API Hero', description: 'From API' }]
        }
      };

      service.getCharacterById(123).subscribe(char => {
        expect(char.name).toBe('API Hero');
        expect(char.source).toBe('api');
      });

      const req = httpMock.expectOne(request => {
        return request.url === 'https://gateway.marvel.com/v1/public/characters/123';
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getCharacterComics', () => {
    it('should fetch comics for a character', () => {
      const mockResponse = {
         data: {
          results: [
            { id: 1, title: 'Amazing Comic #1' },
            { id: 2, title: 'Spectacular Comic #2' }
          ]
        }
      };

      service.getCharacterComics(123, 10).subscribe(comics => {
        expect(comics.length).toBe(2);
        expect(comics[0].title).toBe('Amazing Comic #1');
      });

      const req = httpMock.expectOne(request => {
        return request.url === 'https://gateway.marvel.com/v1/public/characters/123/comics' &&
              request.params.get('limit') === '10';
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createCharacter', () => {
    it('should create a new character with generated ID', (done) => {
      // Mock Date.now() para retornar um valor constante
      spyOn(Date, 'now').and.returnValue(12345);

      const newCharacter = {
        name: 'New Hero',
        description: 'Test description',
        thumbnail: { path: 'test', extension: 'jpg' }
      };

      service.createCharacter(newCharacter as any).subscribe(char => {
        expect(char.id).toBe(12345);
        expect(char.name).toBe('New Hero');
        expect(char.source).toBe('local');
        expect(localStorage.setItem).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('updateCharacter', () => {
    it('should update a character and set modified timestamp', (done) => {
      const character = {
        id: 123,
        name: 'Updated Hero',
        source: 'local' as const,
        description: 'Updated',
        modified: '',
        thumbnail: { path: 'test', extension: 'jpg' }
      };

      service.updateCharacter(character as any).subscribe(char => {
        expect(char.name).toBe('Updated Hero');
        expect(char.modified).toBeDefined();
        expect(localStorage.setItem).toHaveBeenCalled();
        done();
      });
    });

    it('should not save API characters to local storage', (done) => {
      spyOn(service as any, 'saveCharacterToLocalStorage');

      const character = {
        id: 123,
        name: 'API Hero',
        source: 'api' as const,
        description: '',
        modified: '',
        thumbnail: { path: 'test', extension: 'jpg' }
      };

      service.updateCharacter(character as any).subscribe(() => {
        expect(service['saveCharacterToLocalStorage']).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('deleteCharacter', () => {
    it('should delete local character from storage', (done) => {
      spyOn(service as any, 'removeCharacterFromLocalStorage');
      spyOn(service as any, 'markCharacterAsDeleted');

      // 999 é o ID do personagem local
      service.deleteCharacter(999).subscribe(result => {
        expect(result).toBeTrue();
        expect(service['removeCharacterFromLocalStorage']).toHaveBeenCalledWith(999);
        expect(service['markCharacterAsDeleted']).not.toHaveBeenCalled();
        done();
      });
    });

    it('should mark API character as deleted', (done) => {
      spyOn(service as any, 'removeCharacterFromLocalStorage');
      spyOn(service as any, 'markCharacterAsDeleted');

      // Escolha um ID que não exista no localStorage mockado
      service.deleteCharacter(456).subscribe(result => {
        expect(result).toBeTrue();
        expect(service['removeCharacterFromLocalStorage']).not.toHaveBeenCalled();
        expect(service['markCharacterAsDeleted']).toHaveBeenCalledWith(456);
        done();
      });
    });
  });
});
