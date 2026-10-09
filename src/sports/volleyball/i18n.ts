import type { SportsBoardLocale } from '../../viewer/index.js';
import en from './locales/en.json' with { type: 'json' };
import fr from './locales/fr.json' with { type: 'json' };

export type VolleyballMessages = typeof en;
export const VOLLEYBALL_CATALOGS: Readonly<Record<SportsBoardLocale, Readonly<VolleyballMessages>>> = Object.freeze({ en, fr });

export function resolveVolleyballMessages(locale: SportsBoardLocale = 'en', overrides: Partial<VolleyballMessages> = {}): VolleyballMessages {
  return { ...VOLLEYBALL_CATALOGS[locale], ...overrides };
}