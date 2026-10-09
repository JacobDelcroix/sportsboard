import { Registry, registerBuiltins } from '../../core/index.js';
import { registerVolleyballElements } from './elements.js';
import { registerVolleyballSurfaces } from './surfaces.js';

export function registerVolleyball(registry = registerBuiltins(new Registry())): Registry {
  registerVolleyballSurfaces(registry);
  registerVolleyballElements(registry);
  return registry;
}

export { registerVolleyballElements, registerVolleyballSurfaces };
export { Volleyball } from './volleyball.js';
export * from './i18n.js';
export { VolleyballViewer, createVolleyballViewer } from './viewer.js';