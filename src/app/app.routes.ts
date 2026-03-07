import { Routes } from '@angular/router';
import { ImportFacade } from '@features/import/pages/import.facade';
import { PracticeFacade } from '@features/practice/pages/practice.facade';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@features/home/pages/home.component').then((m) => m.HomePage),
  },
  {
    path: 'word-lists',
    loadComponent: () =>
      import('@features/word-lists/pages/word-lists.component').then((m) => m.WordListsPage),
  },
  {
    path: 'word-lists/create',
    loadComponent: () =>
      import('@features/create-word-list/pages/create-word-list.component').then(
        (m) => m.CreateWordListPage,
      ),
  },
  {
    path: 'word-lists/edit/:id',
    loadComponent: () =>
      import('@features/create-word-list/pages/create-word-list.component').then(
        (m) => m.CreateWordListPage,
      ),
  },
  {
    path: 'words',
    loadComponent: () =>
      import('@features/view-word-list/pages/view-word-list.component').then(
        (m) => m.ViewWordListComponent,
      ),
  },
  {
    path: 'words/add',
    loadComponent: () =>
      import('@features/add-word/pages/add-word.component').then((m) => m.AddWordComponent),
  },
  {
    path: 'words/edit/:id',
    loadComponent: () =>
      import('@features/add-word/pages/add-word.component').then((m) => m.AddWordComponent),
  },
  {
    path: 'practice',
    providers: [PracticeFacade],
    loadComponent: () =>
      import('@features/practice/pages/practice.component').then((m) => m.PracticeComponent),
  },
  {
    path: 'import',
    providers: [ImportFacade],
    loadComponent: () =>
      import('@features/import/pages/import.component').then((m) => m.ImportComponent),
  },
  { path: '**', redirectTo: '' },
];
