import type { EditorSportDefinition } from '../editor/index.js';
import type { SportsBoardLocale, ViewerSportDefinition } from '../viewer/index.js';
import { createBasketballEditor } from '../sports/basketball/editor.js';
import type { BasketballMessages } from '../sports/basketball/i18n.js';
import { createBasketballViewer } from '../sports/basketball/viewer.js';
import { createFootballEditor } from '../sports/football/editor.js';
import type { FootballMessages } from '../sports/football/i18n.js';
import { createFootballViewer } from '../sports/football/viewer.js';
import { createVolleyballEditor } from '../sports/volleyball/editor.js';
import type { VolleyballMessages } from '../sports/volleyball/i18n.js';
import { createVolleyballViewer } from '../sports/volleyball/viewer.js';
import type { BuiltInSport, SportsBoardSportMessages } from './types.js';

/** Editor factories for every built-in sport; a missing entry is a compile error. */
export const editorFactories: Record<BuiltInSport, (locale: SportsBoardLocale, overrides?: SportsBoardSportMessages) => EditorSportDefinition> = {
  basketball: (locale, overrides) => createBasketballEditor(locale, overrides as Partial<BasketballMessages>),
  football: (locale, overrides) => createFootballEditor(locale, overrides as Partial<FootballMessages>),
  volleyball: (locale, overrides) => createVolleyballEditor(locale, overrides as Partial<VolleyballMessages>)
};

/** Viewer factories for every built-in sport; a missing entry is a compile error. */
export const viewerFactories: Record<BuiltInSport, (locale: SportsBoardLocale, overrides?: SportsBoardSportMessages) => ViewerSportDefinition> = {
  basketball: (locale, overrides) => createBasketballViewer(locale, overrides as Partial<BasketballMessages>),
  football: (locale, overrides) => createFootballViewer(locale, overrides as Partial<FootballMessages>),
  volleyball: (locale, overrides) => createVolleyballViewer(locale, overrides as Partial<VolleyballMessages>)
};