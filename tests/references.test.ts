import { describe, expect, it } from 'vitest';
import { detachElementReferences, type BoardDocument } from '../src/core/index.js';

describe('detachElementReferences', () => {
  it('keeps connector geometry and detaches child attachments', () => {
    const document: BoardDocument = {
      schema: 'sportsboard',
      version: 1,
      surface: { type: 'test.surface' },
      elements: [
        { id: 'player', type: 'test.player', x: .5, y: .5 },
        { id: 'ball', type: 'test.ball', x: .55, y: .5, attachment: { element: 'player', anchor: { x: .9, y: .3 } } },
        { id: 'run', type: 'core.connector', from: { element: 'player' }, to: { element: 'player' } }
      ]
    };

    detachElementReferences(document, 'player', (_element, key) => key === 'from' ? { x: .45, y: .5 } : { x: .55, y: .5 });

    expect(document.elements[1].attachment).toBeUndefined();
    expect(document.elements[2].from).toEqual({ x: .45, y: .5 });
    expect(document.elements[2].to).toEqual({ x: .55, y: .5 });
  });
});
