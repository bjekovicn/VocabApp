require('dotenv').config();

const { concepts, listNames } = require('./default-word-lists.data');

async function main() {
  const { initializeApp } = await import('firebase/app');
  const { doc, getFirestore, setDoc } = await import('firebase/firestore');

  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
  };

  if (!firebaseConfig.projectId) {
    throw new Error('Missing Firebase environment variables. Check your .env file.');
  }

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const now = new Date();
  const supportedLanguages = Object.keys(listNames);

  for (const sourceLanguage of supportedLanguages) {
    const templateId = `basic-phrases-${sourceLanguage}`;
    const words = concepts.map((concept) => ({
      id: concept.id,
      sourceText: concept.translations[sourceLanguage],
      category: 'other',
      translations: concept.translations,
    }));

    await setDoc(doc(db, 'defaultWordLists', templateId), {
      name: listNames[sourceLanguage],
      slug: 'basic-phrases',
      sourceLanguage,
      words,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`Seeded ${templateId}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
