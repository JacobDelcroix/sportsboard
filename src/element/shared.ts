import type { BoardDocument } from '../core/index.js';
import type { SportsBoardLocale } from '../viewer/types.js';
import type { BuiltInSport, SportsBoardElementOptions } from './types.js';

export const HTMLElementBase = globalThis.HTMLElement ?? class {} as typeof HTMLElement;
export const clone = <T>(value: T): T => structuredClone(value);

export function parseJSON<T>(value: string, label: string): T {
  try { return JSON.parse(value) as T; }
  catch (error) { throw new Error(`Invalid SportsBoard ${label}: ${(error as Error).message}`); }
}

export function booleanAttribute(element: HTMLElement, name: string): boolean | undefined {
  if (!element.hasAttribute(name)) return undefined;
  return element.getAttribute(name)?.toLowerCase() !== 'false';
}

export function copyOptions<T extends SportsBoardElementOptions>(value: T): T {
  return {
    ...value,
    sportMessages: value.sportMessages ? { ...value.sportMessages } : undefined
  };
}

export function resolveIdentity(element: HTMLElement, options: SportsBoardElementOptions): {
  sport: BuiltInSport;
  locale: SportsBoardLocale;
  surface?: string;
} {
  const sport = element.getAttribute('sport') ?? options.sport ?? 'basketball';
  const locale = element.getAttribute('locale') ?? options.locale ?? 'en';
  if (sport !== 'basketball' && sport !== 'football') throw new Error(`Unknown SportsBoard sport '${sport}'`);
  if (locale !== 'en' && locale !== 'fr') throw new Error(`Unknown SportsBoard locale '${locale}'`);
  return { sport, locale, surface: element.getAttribute('surface') ?? options.surface };
}

export function resolveElementData(
  element: HTMLElement,
  current: BoardDocument | string | undefined,
  fallback?: BoardDocument | string
): BoardDocument | string | undefined {
  if (current !== undefined) return clone(current);
  const attribute = element.getAttribute('data');
  if (attribute) return parseJSON<BoardDocument>(attribute, 'data attribute');
  const embedded = element.querySelector<HTMLScriptElement>('script[type="application/json"]');
  if (embedded?.textContent?.trim()) return parseJSON<BoardDocument>(embedded.textContent, 'embedded document');
  return fallback === undefined ? undefined : clone(fallback);
}

export function emit<T>(element: HTMLElement, name: string, detail: T): void {
  element.dispatchEvent(new CustomEvent<T>(name, { detail, bubbles: true, composed: true }));
}

/** Replays a property assigned before the browser upgraded the custom element. */
export function upgradeProperty(element: HTMLElement, name: string): void {
  if (!Object.prototype.hasOwnProperty.call(element, name)) return;
  const properties = element as unknown as Record<string, unknown>;
  const value = properties[name];
  delete properties[name];
  properties[name] = value;
}
