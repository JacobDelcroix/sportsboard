import { Registry, registerBuiltins } from '../../core/index.js';
import type { SportsBoardLocale, ViewerSportDefinition } from '../../viewer/index.js';
import { Basketball } from './basketball.js';
import { resolveBasketballMessages, type BasketballMessages } from './i18n.js';
import { registerBasketballElements } from './elements.js';
import { registerBasketballSurfaces } from './surfaces.js';

/** Creates a localized basketball configuration for the viewer and shared canvas. */
export function createBasketballViewer(locale: SportsBoardLocale = 'en', overrides: Partial<BasketballMessages> = {}): ViewerSportDefinition {
  const messages = resolveBasketballMessages(locale, overrides);
  return {
    id: 'basketball',
    label: messages.sport,
    surfaces: [
      { id: Basketball.surfaces.halfCourt, label: messages.halfCourt },
      { id: Basketball.surfaces.fullCourt, label: messages.fullCourt }
    ],
    createRegistry: () => {
      const registry = registerBuiltins(new Registry());
      registerBasketballSurfaces(registry);
      registerBasketballElements(registry);
      return registry;
    }
  };
}

export const BasketballViewer = createBasketballViewer();
