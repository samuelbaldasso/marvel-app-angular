import { Routes } from '@angular/router';
import { CharacterListComponent } from './pages/character-list/character-list.component';
import { CharacterDetailComponent } from './pages/character-detail/character-detail.component';

export const routes: Routes = [
  {
    path: '',
    component: CharacterListComponent
  },
  {
    path: 'new',
    component: CharacterDetailComponent
  },
  {
    path: ':id',
    component: CharacterDetailComponent
  }
];
