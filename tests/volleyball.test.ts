import { describe, expect, it } from 'vitest';
import Konva from 'konva';
import { validateBoardDocument, type BoardDocument } from '../src/core/index.js';
import { Volleyball, createVolleyballViewer } from '../src/sports/volleyball/viewer-entry.js';
import { createVolleyballEditor } from '../src/sports/volleyball/editor.js';
import { attachToSelectedMagnetTarget } from '../src/editor/change.js';

const documentFor = (surface: string): BoardDocument => ({
  schema: 'sportsboard',
  version: 1,
  surface: { type: surface },
  elements: [
    { id: 'player-1', type: Volleyball.elements.attacker, x: .5, y: .7, data: { number: 1 } },
    { id: 'defender-1', type: Volleyball.elements.defender, x: .5, y: .2, data: { number: 1 } },
    { id: 'ball', type: Volleyball.elements.ball, x: .54, y: .68, attachment: { element: 'player-1', anchor: { x: .94, y: .28 } } },
    { id: 'run', ...Volleyball.run('player-1', { x: .5, y: .25 }) },
    { id: 'pass', ...Volleyball.pass('player-1', 'defender-1') },
    { id: 'set', ...Volleyball.set('player-1', { x: .45, y: .15 }) },
    { id: 'spike', ...Volleyball.spike('player-1', { x: .55, y: .12 }) },
    { id: 'block', ...Volleyball.block('defender-1', { x: .5, y: .1 }) }
  ]
});

describe('volleyball module', () => {
  it.each([Volleyball.surfaces.halfCourt, Volleyball.surfaces.fullCourt])('registers and validates %s', surface => {
    const registry = createVolleyballViewer().createRegistry();
    expect(() => validateBoardDocument(documentFor(surface), registry)).not.toThrow();
    expect(registry.getSurface(surface).ratio).toBeGreaterThan(0);
  });

  it('keeps the ball smaller than a player and only snaps it to players and coaches', () => {
    const registry = createVolleyballViewer().createRegistry();
    const player = registry.getElement(Volleyball.elements.attacker);
    const ball = registry.getElement(Volleyball.elements.ball);

    expect(ball.defaults?.width).toBeLessThan(player.defaults?.width ?? 0);
    expect(ball.connectable).toBe(false);
    expect(ball.magnet?.targetTypes).toEqual([Volleyball.elements.attacker, Volleyball.elements.defender, Volleyball.elements.coach]);
  });

  it.each([
    Volleyball.elements.attacker,
    Volleyball.elements.defender,
    Volleyball.elements.coach
  ])('attaches a clicked ball to a selected %s', targetType => {
    const registry = createVolleyballViewer().createRegistry();
    const selected = { id: 'selected', type: targetType, x: .25, y: .6 };
    const ball = attachToSelectedMagnetTarget(
      { type: Volleyball.elements.ball, x: .5, y: .5 },
      selected,
      registry
    );

    expect(ball.attachment).toEqual({ element: selected.id, anchor: { x: .94, y: .28 } });
    expect({ x: ball.x, y: ball.y }).toEqual({ x: selected.x, y: selected.y });
  });

  it('keeps a clicked ball free when the selection is not a compatible magnet target', () => {
    const registry = createVolleyballViewer().createRegistry();
    const input = { type: Volleyball.elements.ball, x: .5, y: .5 };
    const selected = { id: 'cone', type: Volleyball.elements.cone, x: .3, y: .4 };

    expect(attachToSelectedMagnetTarget(input, selected, registry)).toEqual(input);
  });

  it('exposes six numbered attackers and defenders per side', () => {
    const editor = createVolleyballEditor();

    const attackers = editor.elements.filter(tool => tool.group === 'attackers');
    const defenders = editor.elements.filter(tool => tool.group === 'defenders');
    expect(attackers.map(tool => tool.id)).toEqual(['attacker-1', 'attacker-2', 'attacker-3', 'attacker-4', 'attacker-5', 'attacker-6']);
    expect(defenders.map(tool => tool.id)).toEqual(['defender-1', 'defender-2', 'defender-3', 'defender-4', 'defender-5', 'defender-6']);
  });

  it('exposes localized editor tools', () => {
    const editor = createVolleyballEditor('fr');

    expect(editor.surfaces[0].label).toBe('Demi-terrain');
    expect(editor.groups[0].label).toBe('Attaquants');
    expect(editor.elements.find(tool => tool.id === 'cone')?.label).toBe('Plot');
    expect(editor.connectors.find(tool => tool.id === 'set')?.label).toBe('Passe haute');
    expect(editor.connectors.find(tool => tool.id === 'spike')?.label).toBe('Attaque');
    expect(editor.connectors.find(tool => tool.id === 'block')?.label).toBe('Contre');
  });

  it.each([Volleyball.surfaces.halfCourt, Volleyball.surfaces.fullCourt])('keeps usable space outside %s', surfaceId => {
    const surface = createVolleyballViewer().createRegistry().getSurface(surfaceId);
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