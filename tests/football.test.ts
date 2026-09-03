import { describe, expect, it } from 'vitest';
import Konva from 'konva';
import { validateBoardDocument, type BoardDocument } from '../src/core/index.js';
import { Football, createFootballViewer } from '../src/sports/football/viewer-entry.js';

const documentFor = (surface: string): BoardDocument => ({
  schema: 'sportsboard',
  version: 1,
  surface: { type: surface },
  elements: [
    { id: 'player-9', type: Football.elements.player, x: .5, y: .7, data: { number: 9 } },
    { id: 'ball', type: Football.elements.ball, x: .55, y: .67, attachment: { element: 'player-9', anchor: { x: .94, y: .3 } } },
    { id: 'run', ...Football.run('player-9', { x: .5, y: .25 }) }
  ]
});

describe('football module', () => {
  it.each([Football.surfaces.halfPitch, Football.surfaces.fullPitch])('registers and validates %s', surface => {
    const registry = createFootballViewer().createRegistry();
    expect(() => validateBoardDocument(documentFor(surface), registry)).not.toThrow();
    expect(registry.getSurface(surface).ratio).toBeGreaterThan(1);
  });

  it('keeps the ball smaller than a player and only snaps it to players', () => {
    const registry = createFootballViewer().createRegistry();
    const player = registry.getElement(Football.elements.player);
    const ball = registry.getElement(Football.elements.ball);

    expect(ball.defaults?.width).toBeLessThan(player.defaults?.width ?? 0);
    expect(ball.connectable).toBe(false);
    expect(ball.magnet?.targetTypes).toEqual([Football.elements.player]);
  });

  it.each([Football.surfaces.halfPitch, Football.surfaces.fullPitch])('keeps usable space outside %s', surfaceId => {
    const surface = createFootballViewer().createRegistry().getSurface(surfaceId);
    const width = 1000;
    const height = width / surface.ratio;
    const group = surface.render(width, height) as Konva.Group;
    const children = group.getChildren();
    const boundary = children[children.length - 1] as Konva.Rect;

    expect(boundary.x()).toBeGreaterThan(0);
    expect(boundary.y()).toBeGreaterThan(0);
    expect(boundary.x() + boundary.width()).toBeLessThan(width);
    expect(boundary.y() + boundary.height()).toBeLessThan(height);
  });
});
