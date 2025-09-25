// src/app/testing/test-helpers.ts
import { Character } from '../core/models/character.model';

export function createMockCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 12345,
    name: 'Test Character',
    description: 'Test description',
    modified: new Date().toISOString(),
    thumbnail: {
      path: 'http://example.com/image',
      extension: 'jpg'
    },
    resourceURI: 'http://example.com/characters/1',
    comics: { available: 0, items: [], returned: 0, collectionURI: '' },
    series: { available: 0, items: [], returned: 0, collectionURI: '' },
    stories: { available: 0, items: [], returned: 0, collectionURI: '' },
    events: { available: 0, items: [], returned: 0, collectionURI: '' },
    urls: [],
    source: 'api',
    ...overrides
  };
}
