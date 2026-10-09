import { Registry, registerBuiltins } from '../../core/index.js';
import type { SportsBoardLocale, ViewerSportDefinition } from '../../viewer/index.js';
import { Volleyball } from './volleyball.js';
import { resolveVolleyballMessages, type VolleyballMessages } from './i18n.js';
import { registerVolleyballElements } from './elements.js';
import { registerVolleyballSurfaces } from './surfaces.js';

/** Creates a localized volleyball configuration for the viewer and shared canvas. */
export function createVolleyballViewer(locale: SportsBoardLocale = 'en', overrides: Partial<VolleyballMessages> = {}): ViewerSportDefinition {
  const messages = resolveVolleyballMessages(locale, overrides);
  return {
    id: 'volleyball',
    label: messages.sport,
    surfaces: [
      { id: Volleyball.surfaces.halfCourt, label: messages.halfCourt },
      { id: Volleyball.surfaces.fullCourt, label: messages.fullCourt }
    ],
    createRegistry: () => {
      const registry = registerBuiltins(new Registry());
      registerVolleyballSurfaces(registry);
      registerVolleyballElements(registry);
      return registry;
    }
  };
}

export const VolleyballViewer = createVolleyballViewer();