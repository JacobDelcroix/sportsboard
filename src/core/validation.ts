import type { Registry } from './registry.js';
import type { BoardDocument, BoardElement, ElementDefinition, Endpoint, Point } from './types.js';

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function fail(path: string, message: string): never { throw new Error(`Invalid SportsBoard document at ${path}: ${message}`); }
function assertRecord(value: unknown, path: string): asserts value is Record<string, unknown> { if (!isRecord(value)) fail(path, 'expected an object'); }
function assertString(value: unknown, path: string): asserts value is string { if (typeof value !== 'string' || !value.trim()) fail(path, 'expected a non-empty string'); }
function assertFinite(value: unknown, path: string): asserts value is number { if (typeof value !== 'number' || !Number.isFinite(value)) fail(path, 'expected a finite number'); }

function validateNormalizedPoint(value: unknown, path: string): asserts value is Point {
  assertRecord(value, path);
  assertFinite(value.x, `${path}.x`);
  assertFinite(value.y, `${path}.y`);
  if (value.x < 0 || value.x > 1) fail(`${path}.x`, 'expected a normalized value between 0 and 1');
  if (value.y < 0 || value.y > 1) fail(`${path}.y`, 'expected a normalized value between 0 and 1');
}

function validateEndpointShape(value: unknown, path: string): asserts value is Endpoint {
  assertRecord(value, path);
  if ('element' in value) assertString(value.element, `${path}.element`);
  else validateNormalizedPoint(value, path);
}

function validateOptionalNormalizedNumber(value: unknown, path: string, positive = false): void {
  if (value === undefined) return;
  assertFinite(value, path);
  if (positive && value <= 0) fail(path, 'expected a positive value');
  if (!positive && (value < 0 || value > 1)) fail(path, 'expected a normalized value between 0 and 1');
}

const validateReferences = (
  elements: BoardElement[],
  definitions: Map<string, ElementDefinition>,
  ids: Set<string>
): void => {
  const assertEndpointReference = (endpoint: Endpoint | undefined, path: string): void => {
    if (!endpoint || !('element' in endpoint)) return;
    if (!ids.has(endpoint.element)) fail(`${path}.element`, `unknown element '${endpoint.element}'`);
    const target = elements.find(element => element.id === endpoint.element)!;
    if (definitions.get(target.id)?.connectable === false) fail(`${path}.element`, `element '${endpoint.element}' does not accept connectors`);
  };

  for (const [index, element] of elements.entries()) {
    assertEndpointReference(element.from, `elements[${index}].from`);
    assertEndpointReference(element.to, `elements[${index}].to`);
    if (!element.attachment) continue;
    if (!ids.has(element.attachment.element)) fail(`elements[${index}].attachment.element`, `unknown element '${element.attachment.element}'`);
    if (element.attachment.element === element.id) fail(`elements[${index}].attachment.element`, 'an element cannot attach to itself');
    const definition = definitions.get(element.id)!;
    const target = elements.find(candidate => candidate.id === element.attachment!.element)!;
    const magnet = definition.magnet;
    if (!magnet) fail(`elements[${index}].attachment`, `element type '${element.type}' does not support attachments`);
    if (!magnet.targetTypes.includes(target.type)) fail(`elements[${index}].attachment.element`, `element type '${target.type}' is not an allowed attachment target`);
  }

  const attachmentById = new Map(elements.filter(element => element.attachment).map(element => [element.id, element.attachment!.element]));
  const complete = new Set<string>();
  const visit = (elementId: string, path: Set<string>): void => {
    if (complete.has(elementId)) return;
    if (path.has(elementId)) fail('elements', `attachment cycle detected at '${elementId}'`);
    path.add(elementId);
    const target = attachmentById.get(elementId);
    if (target) visit(target, path);
    path.delete(elementId);
    complete.add(elementId);
  };
  for (const elementId of attachmentById.keys()) visit(elementId, new Set());
};

export function validateBoardDocument(input: unknown, registry: Registry): asserts input is BoardDocument {
  assertRecord(input, '$');
  if (input.schema !== 'sportsboard') fail('schema', "expected 'sportsboard'");
  if (input.version !== 1) fail('version', 'expected version 1');
  if (input.meta !== undefined) {
    assertRecord(input.meta, 'meta');
    if (input.meta.notes !== undefined && typeof input.meta.notes !== 'string') fail('meta.notes', 'expected a string');
  }
  assertRecord(input.surface, 'surface');
  assertString(input.surface.type, 'surface.type');
  try { registry.getSurface(input.surface.type); }
  catch { fail('surface.type', `unknown surface '${input.surface.type}'`); }
  if (input.surface.data !== undefined) assertRecord(input.surface.data, 'surface.data');
  if (!Array.isArray(input.elements)) fail('elements', 'expected an array');

  const ids = new Set<string>();
  const definitions = new Map<string, ElementDefinition>();
  const elements = input.elements as unknown[];
  for (const [index, candidate] of elements.entries()) {
    const path = `elements[${index}]`;
    assertRecord(candidate, path);
    assertString(candidate.id, `${path}.id`);
    if (ids.has(candidate.id)) fail(`${path}.id`, `duplicate element id '${candidate.id}'`);
    ids.add(candidate.id);
    assertString(candidate.type, `${path}.type`);
    let definition: ElementDefinition;
    try { definition = registry.getElement(candidate.type); }
    catch { fail(`${path}.type`, `unknown element type '${candidate.type}'`); }
    definitions.set(candidate.id, definition!);

    validateOptionalNormalizedNumber(candidate.x, `${path}.x`);
    validateOptionalNormalizedNumber(candidate.y, `${path}.y`);
    if (candidate.width !== undefined) {
      assertFinite(candidate.width, `${path}.width`);
      if (candidate.width <= 0 || candidate.width > 1) fail(`${path}.width`, 'expected a normalized value greater than 0 and no greater than 1');
    }
    if (candidate.height !== undefined) {
      assertFinite(candidate.height, `${path}.height`);
      if (candidate.height <= 0 || candidate.height > 1) fail(`${path}.height`, 'expected a normalized value greater than 0 and no greater than 1');
    }
    if (candidate.rotation !== undefined) assertFinite(candidate.rotation, `${path}.rotation`);
    if (candidate.style !== undefined) assertRecord(candidate.style, `${path}.style`);
    if (candidate.data !== undefined) assertRecord(candidate.data, `${path}.data`);
    if (candidate.from !== undefined) validateEndpointShape(candidate.from, `${path}.from`);
    if (candidate.to !== undefined) validateEndpointShape(candidate.to, `${path}.to`);
    if (candidate.waypoints !== undefined) {
      if (!Array.isArray(candidate.waypoints)) fail(`${path}.waypoints`, 'expected an array');
      candidate.waypoints.forEach((point, pointIndex) => validateNormalizedPoint(point, `${path}.waypoints[${pointIndex}]`));
    }
    if (candidate.attachment !== undefined) {
      assertRecord(candidate.attachment, `${path}.attachment`);
      assertString(candidate.attachment.element, `${path}.attachment.element`);
      validateNormalizedPoint(candidate.attachment.anchor, `${path}.attachment.anchor`);
    }
    if (definition!.layer === 'connectors') {
      if (candidate.from === undefined) fail(`${path}.from`, 'connector endpoints require a start');
      if (candidate.to === undefined) fail(`${path}.to`, 'connector endpoints require an end');
    } else if (candidate.x === undefined || candidate.y === undefined) fail(path, 'positioned elements require normalized x and y values');
  }

  validateReferences(input.elements as BoardElement[], definitions, ids);
}
