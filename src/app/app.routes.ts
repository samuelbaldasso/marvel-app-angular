import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'characters',
    loadChildren: () => import('../app/features/characters/characters.routes').then(m => m.routes)

  },
  {
    path: '',
    redirectTo: '/characters',
    pathMatch: 'full'
  }
];
