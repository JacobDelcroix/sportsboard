import type { SportsBoardLocale } from '../../viewer/index.js';
import en from './locales/en.json' with { type: 'json' };
import fr from './locales/fr.json' with { type: 'json' };

export type FootballMessages = typeof en;
export const FOOTBALL_CATALOGS: Readonly<Record<SportsBoardLocale, Readonly<FootballMessages>>> = Object.freeze({ en, fr });

export function resolveFootballMessages(locale: SportsBoardLocale = 'en', overrides: Partial<FootballMessages> = {}): FootballMessages {
  return { ...FOOTBALL_CATALOGS[locale], ...overrides };
}
