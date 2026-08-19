import type { SportsBoardLocale } from '../../viewer/index.js';
import en from './locales/en.json' with { type: 'json' };
import fr from './locales/fr.json' with { type: 'json' };

export type BasketballMessages = typeof en;
export const BASKETBALL_CATALOGS: Readonly<Record<SportsBoardLocale, Readonly<BasketballMessages>>> = Object.freeze({ en, fr });

export function resolveBasketballMessages(locale: SportsBoardLocale = 'en', overrides: Partial<BasketballMessages> = {}): BasketballMessages {
  return { ...BASKETBALL_CATALOGS[locale], ...overrides };
}
