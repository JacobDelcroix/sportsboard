import { isElementEndpoint } from './builtins.js';
import type { BoardDocument, BoardElement, Point } from './types.js';

export type ConnectorEndpointResolver = (element: BoardElement, key: 'from' | 'to') => Point;

/** Detaches references to an element while preserving connector endpoint positions. */
export function detachElementReferences(document: BoardDocument, elementId: string, resolveEndpoint: ConnectorEndpointResolver): void {
  const endpointUpdates: Array<{ element: BoardElement; key: 'from' | 'to'; point: Point }> = [];
  for (const element of document.elements) {
    for (const key of ['from', 'to'] as const) {
      const endpoint = element[key];
      if (endpoint && isElementEndpoint(endpoint) && endpoint.element === elementId) endpointUpdates.push({ element, key, point: resolveEndpoint(element, key) });
    }
    if (element.attachment?.element === elementId) delete element.attachment;
  }
  for (const { element, key, point } of endpointUpdates) element[key] = point;
}
