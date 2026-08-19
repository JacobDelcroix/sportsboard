import { describe, expect, it } from 'vitest';
import { requestsWheelZoom } from '../src/core/interactions.js';

describe('board wheel interactions', () => {
  it('leaves an unmodified wheel gesture to the surrounding page', () => {
    expect(requestsWheelZoom({ metaKey: false, ctrlKey: false })).toBe(false);
  });

  it('zooms when the platform command modifier is held', () => {
    expect(requestsWheelZoom({ metaKey: true, ctrlKey: false })).toBe(true);
    expect(requestsWheelZoom({ metaKey: false, ctrlKey: true })).toBe(true);
  });
});
