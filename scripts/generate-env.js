const fs = require('fs');
const path = require('path');
require('dotenv').config();

const env = process.env;

const devContent = `export const environment = {
  production: false,
  firebase: {
    apiKey: '${env.FIREBASE_API_KEY || ''}',
    authDomain: '${env.FIREBASE_AUTH_DOMAIN || ''}',
    projectId: '${env.FIREBASE_PROJECT_ID || ''}',
    storageBucket: '${env.FIREBASE_STORAGE_BUCKET || ''}',
    messagingSenderId: '${env.FIREBASE_MESSAGING_SENDER_ID || ''}',
    appId: '${env.FIREBASE_APP_ID || ''}',
  }
};
`;

const prodContent = `export const environment = {
  production: true,
  firebase: {
    apiKey: '${env.FIREBASE_API_KEY || ''}',
    authDomain: '${env.FIREBASE_AUTH_DOMAIN || ''}',
    projectId: '${env.FIREBASE_PROJECT_ID || ''}',
    storageBucket: '${env.FIREBASE_STORAGE_BUCKET || ''}',
    messagingSenderId: '${env.FIREBASE_MESSAGING_SENDER_ID || ''}',
    appId: '${env.FIREBASE_APP_ID || ''}',
  }
};
`;

const devPath = path.join(__dirname, '../src/environments/environment.ts');
const prodPath = path.join(__dirname, '../src/environments/environment.prod.ts');

if (!fs.existsSync(path.join(__dirname, '../src/environments'))) {
  fs.mkdirSync(path.join(__dirname, '../src/environments'));
}

fs.writeFileSync(devPath, devContent);
fs.writeFileSync(prodPath, prodContent);
