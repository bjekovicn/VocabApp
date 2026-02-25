export function buildImportPrompt(
  sourceLanguage: string,
  targetLanguage: string,
  topic: string,
): string {
  return `Generiši JSON u sledećem formatu za učenje vokabulara.

DOZVOLJENE category vrednosti (koristi ISKLJUČIVO jednu od ovih):
"noun" | "verb" | "adjective" | "adverb" | "pronoun" | "preposition" | "conjunction" | "other"

PRAVILA:
- category mora biti jedna od dozvoljenih vrednosti
- Uključi TAČNO 2 quizDistractorsSourceToTarget (pogrešni prevodi na ciljnom jeziku)
- Uključi TAČNO 2 quizDistractorsTargetToSource (pogrešne reči na izvornom jeziku)
- note je OPCIONALNO polje — dodaj ga SAMO ako postoji nešto što bi pomoglo pri učenju:
    • gramatička napomena
    • važna razlika od sličnih reči
    • česta greška kod učenja
    • zanimljiva veza ili porijeklo reči
    Ako nema nešto baš korisno za napomenuti, IZOSTAVI polje note potpuno.
- Vrati ISKLJUČIVO validan JSON, bez objašnjenja, komentara ili markdown-a

FORMAT:
{
  "words": [
    {
      "sourceText": "laufen",
      "targetText": "trčati",
      "category": "verb",
      "note": "Nepravilan glagol: läuft, lief, ist gelaufen",
      "quizDistractorsSourceToTarget": ["hodati", "skakati"],
      "quizDistractorsTargetToSource": ["gehen", "springen"]
    },
    {
      "sourceText": "der Tisch",
      "targetText": "sto",
      "category": "noun",
      "quizDistractorsSourceToTarget": ["stolica", "polica"],
      "quizDistractorsTargetToSource": ["der Stuhl", "das Regal"]
    }
  ]
}

Izvorni jezik: ${sourceLanguage}
Ciljni jezik: ${targetLanguage}
Tema: ${topic || '(Nije specifirana - generiši osnovne/opšte reči)'}`;
}
