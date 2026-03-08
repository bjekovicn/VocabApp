const listNames = {
  sr: '20 osnovnih fraza',
  en: '20 Basic Phrases',
  de: '20 grundlegende Phrasen',
  es: '20 frases basicas',
  it: '20 frasi di base',
  fr: '20 phrases essentielles',
};

const concepts = [
  {
    id: 'hello',
    translations: {
      sr: 'Zdravo',
      en: 'Hello',
      de: 'Hallo',
      es: 'Hola',
      it: 'Ciao',
      fr: 'Bonjour',
    },
  },
  {
    id: 'good_morning',
    translations: {
      sr: 'Dobro jutro',
      en: 'Good morning',
      de: 'Guten Morgen',
      es: 'Buenos dias',
      it: 'Buongiorno',
      fr: 'Bonjour',
    },
  },
  {
    id: 'good_evening',
    translations: {
      sr: 'Dobro vece',
      en: 'Good evening',
      de: 'Guten Abend',
      es: 'Buenas noches',
      it: 'Buonasera',
      fr: 'Bonsoir',
    },
  },
  {
    id: 'goodbye',
    translations: {
      sr: 'Dovidjenja',
      en: 'Goodbye',
      de: 'Auf Wiedersehen',
      es: 'Adios',
      it: 'Arrivederci',
      fr: 'Au revoir',
    },
  },
  {
    id: 'please',
    translations: {
      sr: 'Molim',
      en: 'Please',
      de: 'Bitte',
      es: 'Por favor',
      it: 'Per favore',
      fr: "S'il vous plait",
    },
  },
  {
    id: 'thank_you',
    translations: {
      sr: 'Hvala',
      en: 'Thank you',
      de: 'Danke',
      es: 'Gracias',
      it: 'Grazie',
      fr: 'Merci',
    },
  },
  {
    id: 'yes',
    translations: {
      sr: 'Da',
      en: 'Yes',
      de: 'Ja',
      es: 'Si',
      it: 'Si',
      fr: 'Oui',
    },
  },
  {
    id: 'no',
    translations: {
      sr: 'Ne',
      en: 'No',
      de: 'Nein',
      es: 'No',
      it: 'No',
      fr: 'Non',
    },
  },
  {
    id: 'sorry',
    translations: {
      sr: 'Izvini',
      en: 'Sorry',
      de: 'Es tut mir leid',
      es: 'Lo siento',
      it: 'Mi dispiace',
      fr: 'Desole',
    },
  },
  {
    id: 'excuse_me',
    translations: {
      sr: 'Izvinite',
      en: 'Excuse me',
      de: 'Entschuldigung',
      es: 'Perdon',
      it: 'Scusi',
      fr: 'Excusez-moi',
    },
  },
  {
    id: 'how_are_you',
    translations: {
      sr: 'Kako si?',
      en: 'How are you?',
      de: 'Wie geht es dir?',
      es: 'Como estas?',
      it: 'Come stai?',
      fr: 'Comment ca va ?',
    },
  },
  {
    id: 'im_fine',
    translations: {
      sr: 'Dobro sam.',
      en: "I'm fine.",
      de: 'Mir geht es gut.',
      es: 'Estoy bien.',
      it: 'Sto bene.',
      fr: 'Ca va bien.',
    },
  },
  {
    id: 'what_is_your_name',
    translations: {
      sr: 'Kako se zoves?',
      en: 'What is your name?',
      de: 'Wie heisst du?',
      es: 'Como te llamas?',
      it: 'Come ti chiami?',
      fr: "Comment tu t'appelles ?",
    },
  },
  {
    id: 'my_name_is',
    translations: {
      sr: 'Zovem se...',
      en: 'My name is...',
      de: 'Ich heisse...',
      es: 'Me llamo...',
      it: 'Mi chiamo...',
      fr: "Je m'appelle...",
    },
  },
  {
    id: 'nice_to_meet_you',
    translations: {
      sr: 'Drago mi je.',
      en: 'Nice to meet you.',
      de: 'Freut mich.',
      es: 'Mucho gusto.',
      it: 'Piacere.',
      fr: 'Enchante.',
    },
  },
  {
    id: 'i_dont_understand',
    translations: {
      sr: 'Ne razumem.',
      en: "I don't understand.",
      de: 'Ich verstehe nicht.',
      es: 'No entiendo.',
      it: 'Non capisco.',
      fr: 'Je ne comprends pas.',
    },
  },
  {
    id: 'do_you_speak_english',
    translations: {
      sr: 'Da li govoris engleski?',
      en: 'Do you speak English?',
      de: 'Sprichst du Englisch?',
      es: 'Hablas ingles?',
      it: 'Parli inglese?',
      fr: 'Parlez-vous anglais ?',
    },
  },
  {
    id: 'where_is_the_bathroom',
    translations: {
      sr: 'Gde je kupatilo?',
      en: 'Where is the bathroom?',
      de: 'Wo ist die Toilette?',
      es: 'Donde esta el bano?',
      it: "Dov'e il bagno?",
      fr: 'Ou sont les toilettes ?',
    },
  },
  {
    id: 'how_much_does_it_cost',
    translations: {
      sr: 'Koliko kosta?',
      en: 'How much does it cost?',
      de: 'Wie viel kostet das?',
      es: 'Cuanto cuesta?',
      it: 'Quanto costa?',
      fr: 'Combien ca coute ?',
    },
  },
  {
    id: 'help',
    translations: {
      sr: 'Pomoc!',
      en: 'Help!',
      de: 'Hilfe!',
      es: 'Ayuda!',
      it: 'Aiuto!',
      fr: 'Au secours !',
    },
  },
];

module.exports = {
  concepts,
  listNames,
};
