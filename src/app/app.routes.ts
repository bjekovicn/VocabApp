import { Routes } from '@angular/router';
import { HomePage } from '@features/home/pages/home.component';
import { ImportComponent } from '@features/import/import.component';
import { PracticeComponent } from '@features/practice/pages/practice.component';
import { AddWordComponent } from '@features/word-lists/pages/add-word/add-word.component';
import { CreateListPage } from '@features/word-lists/pages/create-list/create-list.component';
import { ListManagerPage } from '@features/word-lists/pages/list-manager/list-manager.component';
import { WordListComponent } from '@features/word-lists/pages/word-list/word-list.component';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'word-lists', component: ListManagerPage },
  { path: 'word-lists/create', component: CreateListPage },
  { path: 'word-lists/edit/:id', component: CreateListPage },
  { path: 'words', component: WordListComponent },
  { path: 'words/add', component: AddWordComponent },
  { path: 'words/edit/:id', component: AddWordComponent },
  { path: 'practice', component: PracticeComponent },
  { path: 'import', component: ImportComponent },
  { path: '**', redirectTo: '' },
];
