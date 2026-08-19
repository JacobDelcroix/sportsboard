import { resolveViewerMessages } from '../viewer/index.js';
import en from './locales/en.json' with { type: 'json' };
import fr from './locales/fr.json' with { type: 'json' };
import type { EditorMessages, SportsBoardLocale } from './types.js';

export const EDITOR_CATALOGS = Object.freeze({ en, fr });

export function resolveEditorMessages(locale: SportsBoardLocale = 'en', overrides: Partial<EditorMessages> = {}): EditorMessages {
  return { ...resolveViewerMessages(locale), ...EDITOR_CATALOGS[locale], ...overrides };
}
