import { Registry, registerBuiltins } from '../../core/index.js';
import { registerBasketballElements } from './elements.js';
import { registerBasketballSurfaces } from './surfaces.js';

export function registerBasketball(registry = registerBuiltins(new Registry())): Registry {
  registerBasketballSurfaces(registry);
  registerBasketballElements(registry);
  return registry;
}

export { registerBasketballElements, registerBasketballSurfaces };
export { Basketball } from './basketball.js';
export * from './i18n.js';
export { BasketballViewer, createBasketballViewer } from './viewer.js';
