import { describe, expect, it } from 'vitest';
import { Registry, validateBoardDocument, type BoardDocument } from '../src/core/index.js';

const registry = (): Registry => new Registry()
  .registerSurface('test.surface', { ratio: 1, render: () => ({}) as never })
  .registerElement('test.player', { render: () => ({}) as never })
  .registerElement('test.ball', { connectable: false, magnet: { targetTypes: ['test.player'] }, render: () => ({}) as never })
  .registerElement('test.attached', { magnet: { targetTypes: ['test.attached'] }, render: () => ({}) as never })
  .registerElement('core.connector', { layer: 'connectors', render: () => ({}) as never });

const validDocument = (): BoardDocument => ({
  schema: 'sportsboard',
  version: 1,
  surface: { type: 'test.surface' },
  elements: [
    { id: 'player', type: 'test.player', x: .5, y: .5 },
    { id: 'ball', type: 'test.ball', x: .55, y: .5, attachment: { element: 'player', anchor: { x: .9, y: .3 } } },
    { id: 'run', type: 'core.connector', from: { element: 'player' }, to: { x: .8, y: .2 } }
  ]
});

describe('validateBoardDocument', () => {
  it('accepts a complete valid document', () => {
    expect(() => validateBoardDocument(validDocument(), registry())).not.toThrow();
  });

  it.each([
    ['unknown surface', (document: BoardDocument) => { document.surface.type = 'missing'; }, 'unknown surface'],
    ['duplicate IDs', (document: BoardDocument) => { document.elements[1].id = 'player'; }, 'duplicate element id'],
    ['invalid coordinate', (document: BoardDocument) => { document.elements[0].x = 2; }, 'normalized value'],
    ['broken endpoint', (document: BoardDocument) => { document.elements[2].from = { element: 'missing' }; }, 'unknown element'],
    ['non-connectable endpoint', (document: BoardDocument) => { document.elements[2].from = { element: 'ball' }; }, 'does not accept connectors']
  ])('rejects %s', (_name, mutate, message) => {
    const document = validDocument();
    mutate(document);
    expect(() => validateBoardDocument(document, registry())).toThrow(message);
  });

  it('rejects attachment cycles', () => {
    const document = validDocument();
    document.elements = [
      { id: 'a', type: 'test.attached', x: .3, y: .3, attachment: { element: 'b', anchor: { x: .5, y: .5 } } },
      { id: 'b', type: 'test.attached', x: .7, y: .7, attachment: { element: 'a', anchor: { x: .5, y: .5 } } }
    ];
    expect(() => validateBoardDocument(document, registry())).toThrow('attachment cycle');
  });
});
