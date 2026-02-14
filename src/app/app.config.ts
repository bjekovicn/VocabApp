import { ApplicationConfig, inject, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { StorageService } from '@core/services/abstractions/storage.service';
import { FirebaseStorageService } from '@core/services/implementations/firebase-storage.service';
import { SpacedRepetitionService } from '@core/services/abstractions/spaced-repetition.service';
import { SM2SpacedRepetitionService } from '@core/services/implementations/sm2-repetition.service';
import { ImportService } from '@core/services/abstractions/import.service';
import { JsonImportService } from '@core/services/implementations/json-import.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),

    { provide: StorageService, useClass: FirebaseStorageService },
    { provide: SpacedRepetitionService, useClass: SM2SpacedRepetitionService },
    { provide: ImportService, useClass: JsonImportService },
  ],
};
