import { describe, expect, it } from 'vitest';
import { createClipboardElement } from '../src/editor/clipboard.js';
import type { BoardDocument } from '../src/core/index.js';

const document: BoardDocument = {
  schema: 'sportsboard',
  version: 1,
  surface: { type: 'basketball.halfcourt' },
  elements: [
    { id: 'player-1', type: 'basketball.attacker', x: .3, y: .4 },
    { id: 'ball-1', type: 'basketball.ball', x: .33, y: .41, attachment: { element: 'player-1', anchor: { x: .9, y: .3 } } },
    { id: 'run-1', type: 'core.connector', from: { element: 'player-1' }, to: { x: .7, y: .2 }, waypoints: [{ x: .5, y: .3 }] }
  ]
};

describe('editor clipboard', () => {
  it('creates an offset independent copy of an attached element', () => {
    const copy = createClipboardElement(document.elements[1], document, .05);

    expect(copy.id).toBeUndefined();
    expect(copy.attachment).toBeUndefined();
    expect(copy.x).toBeCloseTo(.38);
    expect(copy.y).toBeCloseTo(.46);
  });

  it('turns connector attachments into movable free endpoints', () => {
    const copy = createClipboardElement(document.elements[2], document, .05);

    expect(copy.from).toEqual({ x: .35, y: .45 });
    expect(copy.to).toEqual({ x: .75, y: .25 });
    expect(copy.waypoints).toEqual([{ x: .55, y: .35 }]);
  });

  it('keeps pasted geometry inside the normalized board', () => {
    const copy = createClipboardElement({ id: 'edge', type: 'basketball.attacker', x: .99, y: 1 }, document, .05);

    expect(copy.x).toBe(1);
    expect(copy.y).toBe(1);
  });
});
