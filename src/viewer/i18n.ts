import en from './locales/en.json' with { type: 'json' };
import fr from './locales/fr.json' with { type: 'json' };
import type { SportsBoardLocale, ViewerMessages } from './types.js';

export const VIEWER_CATALOGS: Readonly<Record<SportsBoardLocale, Readonly<ViewerMessages>>> = Object.freeze({ en, fr });

export function resolveViewerMessages(locale: SportsBoardLocale = 'en', overrides: Partial<ViewerMessages> = {}): ViewerMessages {
  return { ...VIEWER_CATALOGS[locale], ...overrides };
}
