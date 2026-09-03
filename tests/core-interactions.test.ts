import { describe, expect, it } from 'vitest';
import { MODE_PRESETS, SportsBoard, type BoardPermissions } from '../src/core/index.js';
import { constrainTransformerBox, requestsWheelZoom } from '../src/core/interactions.js';

const boardWithPermissions = (overrides: Partial<BoardPermissions>): SportsBoard => {
  const board = Object.create(SportsBoard.prototype) as SportsBoard;
  (board as unknown as { permissions: BoardPermissions }).permissions = { ...MODE_PRESETS.editor, ...overrides };
  return board;
};

describe('board wheel interactions', () => {
  it('leaves an unmodified wheel gesture to the surrounding page', () => {
    expect(requestsWheelZoom({ metaKey: false, ctrlKey: false })).toBe(false);
  });

  it('zooms when the platform command modifier is held', () => {
    expect(requestsWheelZoom({ metaKey: true, ctrlKey: false })).toBe(true);
    expect(requestsWheelZoom({ metaKey: false, ctrlKey: true })).toBe(true);
  });
});

describe('board transformer constraints', () => {
  const oldBox = { x: 20, y: 30, width: 100, height: 60, rotation: 0 };

  it('allows rotation for elements that cannot be resized', () => {
    const rotated = { ...oldBox, x: 40, y: 10, rotation: Math.PI / 2 };

    expect(constrainTransformerBox(oldBox, rotated, undefined, 800, 500, 1)).toBe(rotated);
  });

  it('allows rotation for resizable elements without applying size limits', () => {
    const rotated = { ...oldBox, width: 20, height: 500, rotation: Math.PI / 4 };
    const bounds = { minWidth: .08, minHeight: .06, maxWidth: .9, maxHeight: .9 };

    expect(constrainTransformerBox(oldBox, rotated, bounds, 800, 500, 1)).toBe(rotated);
  });

  it('still rejects resize dimensions outside the configured bounds', () => {
    const resized = { ...oldBox, width: 20 };
    const bounds = { minWidth: .08, minHeight: .06, maxWidth: .9, maxHeight: .9 };

    expect(constrainTransformerBox(oldBox, resized, bounds, 800, 500, 1)).toBe(oldBox);
  });
});

describe('board update permissions', () => {
  it('does not let update bypass the move permission', () => {
    expect(() => boardWithPermissions({ move: false }).update('missing', { x: .5 })).toThrow("permission 'move'");
  });

  it('does not let update bypass the rotate permission', () => {
    expect(() => boardWithPermissions({ rotate: false }).update('missing', { rotation: 10 })).toThrow("permission 'rotate'");
  });
});
