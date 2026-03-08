import { WordCategory } from './word-category.model';

export interface DefaultWordTemplate {
  id: string;
  sourceText: string;
  category: WordCategory;
  note?: string;
  translations: Partial<Record<string, string>>;
}

export interface DefaultWordListTemplate {
  id: string;
  name: string;
  slug: string;
  sourceLanguage: string;
  words: DefaultWordTemplate[];
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_VIRTUAL_LIST_PREFIX = 'default';
export const DEFAULT_CLONE_LIST_PREFIX = 'default-clone';
export const DEFAULT_CLONE_WORD_PREFIX = 'default-clone-word';

export function createDefaultVirtualListId(defaultListId: string, targetLanguage: string): string {
  return `${DEFAULT_VIRTUAL_LIST_PREFIX}:${defaultListId}:${targetLanguage}`;
}

export function createDefaultCloneListId(defaultListId: string, targetLanguage: string): string {
  return `${DEFAULT_CLONE_LIST_PREFIX}:${defaultListId}:${targetLanguage}`;
}

export function createDefaultCloneWordId(
  defaultListId: string,
  targetLanguage: string,
  defaultWordId: string,
): string {
  return `${DEFAULT_CLONE_WORD_PREFIX}:${defaultListId}:${targetLanguage}:${defaultWordId}`;
}

export function isDefaultVirtualListId(id: string): boolean {
  return id.startsWith(`${DEFAULT_VIRTUAL_LIST_PREFIX}:`);
}

export function parseDefaultVirtualListId(
  id: string,
): { defaultListId: string; targetLanguage: string } | null {
  if (!isDefaultVirtualListId(id)) {
    return null;
  }

  const parts = id.split(':');
  if (parts.length !== 3) {
    return null;
  }

  return {
    defaultListId: parts[1],
    targetLanguage: parts[2],
  };
}
