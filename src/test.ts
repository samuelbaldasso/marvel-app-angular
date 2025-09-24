// This file is required by karma.conf.js and loads recursively all the .spec and framework files
import 'zone.js';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Alternativa para require.context no Angular 17
// Função auxiliar para importar todos os arquivos .spec.ts
function importAll(r: any) {
  r.keys().forEach(r);
}

// Importar todos os arquivos de teste
// A utilização de importações estáticas é preferida no Angular 17
import './app/app.component.spec';
import './app/core/services/marvel-api.service.spec';
import './app/core/services/character.state.spec';
import './app/core/services/local-storage.service.spec';
import './app/features/characters/pages/character-detail/character-detail.component.spec';
import './app/features/characters/pages/character-list/character-list.component.spec';
import './app/shared/pipes/thumbnail.pipe.spec';
import './app/features/characters/components/character-card/character-card.component.spec';
import './app/features/characters/components/character-form-dialog/character-form-dialog.component.spec';
