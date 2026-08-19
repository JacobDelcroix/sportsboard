import { Registry, registerBuiltins } from '../../core/index.js';
import type { SportsBoardLocale, ViewerSportDefinition } from '../../viewer/index.js';
import { registerFootballElements } from './elements.js';
import { Football } from './football.js';
import { resolveFootballMessages, type FootballMessages } from './i18n.js';
import { registerFootballSurfaces } from './surfaces.js';

/** Creates a localized football configuration for the viewer and shared canvas. */
export function createFootballViewer(locale: SportsBoardLocale = 'en', overrides: Partial<FootballMessages> = {}): ViewerSportDefinition {
  const messages = resolveFootballMessages(locale, overrides);
  return {
    id: 'football',
    label: messages.sport,
    surfaces: [
      { id: Football.surfaces.halfPitch, label: messages.halfPitch },
      { id: Football.surfaces.fullPitch, label: messages.fullPitch }
    ],
    createRegistry: () => {
      const registry = registerBuiltins(new Registry());
      registerFootballSurfaces(registry);
      registerFootballElements(registry);
      return registry;
    }
  };
}

export const FootballViewer = createFootballViewer();
