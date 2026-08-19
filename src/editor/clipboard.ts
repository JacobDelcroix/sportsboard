import type { BoardDocument, BoardElement, ElementInput, Endpoint, Point } from '../core/index.js';

const clone = <T>(value: T): T => structuredClone(value);
const clamp = (value: number): number => Math.max(0, Math.min(1, value));
const offsetPoint = (point: Point, offset: number): Point => ({ x: clamp(point.x + offset), y: clamp(point.y + offset) });
const isPoint = (endpoint: Endpoint): endpoint is Point => 'x' in endpoint && 'y' in endpoint;

function endpointPoint(endpoint: Endpoint | undefined, document: BoardDocument, fallback: Point): Point {
  if (!endpoint) return fallback;
  if (isPoint(endpoint)) return endpoint;
  const referenced = document.elements.find(element => element.id === endpoint.element);
  return referenced?.x !== undefined && referenced.y !== undefined
    ? { x: referenced.x, y: referenced.y }
    : fallback;
}

/** Creates an independent, visibly offset element that can safely be pasted into the same board. */
export function createClipboardElement(element: BoardElement, document: BoardDocument, offset = .025): ElementInput {
  const copy = clone(element) as ElementInput;
  delete copy.id;

  if (copy.x !== undefined) copy.x = clamp(copy.x + offset);
  if (copy.y !== undefined) copy.y = clamp(copy.y + offset);

  // Pasted items should be independently movable, even when the source was attached.
  delete copy.attachment;

  if (copy.from || copy.to) {
    const fallback = { x: element.x ?? .5, y: element.y ?? .5 };
    copy.from = offsetPoint(endpointPoint(element.from, document, fallback), offset);
    copy.to = offsetPoint(endpointPoint(element.to, document, fallback), offset);
  }

  if (copy.waypoints) copy.waypoints = copy.waypoints.map(point => offsetPoint(point, offset));
  return copy;
}
