import { Registry, registerBuiltins } from '../../core/index.js';
import { registerFootballElements } from './elements.js';
import { registerFootballSurfaces } from './surfaces.js';

export function registerFootball(registry = registerBuiltins(new Registry())): Registry {
  registerFootballSurfaces(registry);
  registerFootballElements(registry);
  return registry;
}

export { registerFootballElements, registerFootballSurfaces };
export { Football } from './football.js';
export * from './i18n.js';
export { FootballViewer, createFootballViewer } from './viewer.js';
