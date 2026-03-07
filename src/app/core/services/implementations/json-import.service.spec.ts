import { JsonImportService } from './json-import.service';

describe('JsonImportService', () => {
  const service = new JsonImportService();

  it('parses valid JSON import payloads', async () => {
    const result = await service.parseJson(`{
      "words": [
        {
          "sourceText": "Haus",
          "targetText": "Kuća",
          "category": "noun",
          "quizDistractorsSourceToTarget": ["Stan", "Zgrada"],
          "quizDistractorsTargetToSource": ["Baum", "Auto"]
        }
      ]
    }`);

    expect(result.words).toHaveLength(1);
    expect(result.words[0].sourceText).toBe('Haus');
  });

  it('throws a friendly error for invalid JSON', async () => {
    await expect(service.parseJson('{ invalid json }')).rejects.toThrow(
      'Nevažeći JSON format — provjeri zagrade i zareze',
    );
  });

  it('formats schema validation errors with field paths', async () => {
    await expect(
      service.parseJson(`{
        "words": [
          {
            "sourceText": "",
            "targetText": "Kuća",
            "category": "noun",
            "quizDistractorsSourceToTarget": ["Stan", "Zgrada"],
            "quizDistractorsTargetToSource": ["Baum", "Auto"]
          }
        ]
      }`),
    ).rejects.toThrow('words[0].sourceText: sourceText ne smije biti prazan');
  });

  it('maps imported words to CreateWordDto values', () => {
    const dtos = service.convertToCreateDtos(
      {
        words: [
          {
            sourceText: 'laufen',
            targetText: 'trčati',
            category: 'verb',
            note: 'nepravilni glagol',
            quizDistractorsSourceToTarget: ['šetati', 'skakati'],
            quizDistractorsTargetToSource: ['gehen', 'spielen'],
          },
        ],
      },
      'list-1',
      'de-sr',
    );

    expect(dtos).toEqual([
      {
        sourceText: 'laufen',
        targetText: 'trčati',
        category: 'verb',
        note: 'nepravilni glagol',
        listId: 'list-1',
        languagePair: 'de-sr',
        quizDistractorsSourceToTarget: ['šetati', 'skakati'],
        quizDistractorsTargetToSource: ['gehen', 'spielen'],
      },
    ]);
  });
});
