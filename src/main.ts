import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { environment } from './environments/environment';

async function main() {
  initializeApp(environment.firebase);

  const auth = getAuth();
  await signInAnonymously(auth);

  await bootstrapApplication(App, appConfig);
}

main().catch(console.error);
