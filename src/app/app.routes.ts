import { Routes } from '@angular/router';
import { HomePage } from '@features/home/pages/home.component';
import { ImportComponent } from '@features/import/pages/import.component';
import { PracticeComponent } from '@features/practice/pages/practice.component';
import { AddWordComponent } from '@features/add-word/pages/add-word.component';
import { CreateWordListPage } from '@features/create-word-list/pages/create-word-list.component';
import { WordListsPage } from '@features/word-lists/pages/word-lists.component';
import { ViewWordListComponent } from '@features/view-word-list/pages/view-word-list.component';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'word-lists', component: WordListsPage },
  { path: 'word-lists/create', component: CreateWordListPage },
  { path: 'word-lists/edit/:id', component: CreateWordListPage },
  { path: 'words', component: ViewWordListComponent },
  { path: 'words/add', component: AddWordComponent },
  { path: 'words/edit/:id', component: AddWordComponent },
  { path: 'practice', component: PracticeComponent },
  { path: 'import', component: ImportComponent },
  { path: '**', redirectTo: '' },
];
