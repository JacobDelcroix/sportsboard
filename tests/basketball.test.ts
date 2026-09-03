import { describe, expect, it } from 'vitest';
import Konva from 'konva';
import { validateBoardDocument, type BoardDocument, type SportsBoard } from '../src/core/index.js';
import { Basketball, createBasketballViewer } from '../src/sports/basketball/viewer-entry.js';
import { createBasketballEditor } from '../src/sports/basketball/editor.js';
import { attachToSelectedMagnetTarget } from '../src/editor/change.js';

const documentWithEquipment = (): BoardDocument => ({
  schema: 'sportsboard',
  version: 1,
  surface: { type: Basketball.surfaces.fullCourt },
  elements: [
    { id: 'training-hoop', type: Basketball.elements.trainingHoop, x: .3, y: .5 },
    { id: 'extra-basket', type: Basketball.elements.basket, x: .7, y: .5, rotation: 90 }
  ]
});

describe('basketball equipment', () => {
  it('registers training hoops and additional baskets', () => {
    const registry = createBasketballViewer().createRegistry();

    expect(() => validateBoardDocument(documentWithEquipment(), registry)).not.toThrow();
    expect(registry.getElement(Basketball.elements.trainingHoop).connectable).toBe(false);
    const basket = registry.getElement(Basketball.elements.basket);
    expect(basket.connectable).toBe(false);
    expect(basket.defaults?.width).toBe(.14);
    expect(basket.defaults?.height).toBe(.075);
  });

  it('allows movements and the ball to attach to a coach', () => {
    const registry = createBasketballViewer().createRegistry();
    const coach = registry.getElement(Basketball.elements.coach);
    const ball = registry.getElement(Basketball.elements.ball);

    expect(coach.connectable).toBe(true);
    expect(ball.magnet?.targetTypes).toContain(Basketball.elements.coach);

    const document = documentWithEquipment();
    document.elements.push(
      { id: 'coach', type: Basketball.elements.coach, x: .5, y: .8 },
      { id: 'coach-ball', type: Basketball.elements.ball, x: .54, y: .78, attachment: { element: 'coach', anchor: { x: .94, y: .28 } } },
      { id: 'coach-run', type: 'core.connector', from: { element: 'coach' }, to: { x: .5, y: .3 }, data: { movement: 'run' } }
    );

    expect(() => validateBoardDocument(document, registry)).not.toThrow();
  });

  it.each([
    Basketball.elements.attacker,
    Basketball.elements.defender,
    Basketball.elements.coach
  ])('attaches a clicked ball to a selected %s', targetType => {
    const registry = createBasketballViewer().createRegistry();
    const selected = { id: 'selected', type: targetType, x: .25, y: .6 };
    const ball = attachToSelectedMagnetTarget(
      { type: Basketball.elements.ball, x: .5, y: .5 },
      selected,
      registry
    );

    expect(ball.attachment).toEqual({ element: selected.id, anchor: { x: .94, y: .28 } });
    expect({ x: ball.x, y: ball.y }).toEqual({ x: selected.x, y: selected.y });
  });

  it('keeps clicked equipment free when the selection is not a compatible magnet target', () => {
    const registry = createBasketballViewer().createRegistry();
    const input = { type: Basketball.elements.ball, x: .5, y: .5 };
    const selected = { id: 'cone', type: Basketball.elements.cone, x: .3, y: .4 };

    expect(attachToSelectedMagnetTarget(input, selected, registry)).toEqual(input);
  });

  it('does not allow movements to attach to the new equipment', () => {
    const registry = createBasketballViewer().createRegistry();
    const document = documentWithEquipment();
    document.elements.push({
      id: 'run',
      type: 'core.connector',
      from: { element: 'training-hoop' },
      to: { element: 'extra-basket' },
      data: { movement: 'run' }
    });

    expect(() => validateBoardDocument(document, registry)).toThrow('does not accept connectors');
  });

  it('exposes localized editor tools', () => {
    const editor = createBasketballEditor('fr');

    expect(editor.elements.find(tool => tool.id === 'training-hoop')?.label).toBe('Cerceau');
    expect(editor.elements.find(tool => tool.id === 'basket')?.label).toBe('Panier');
  });

  it('faces newly inserted half-court defenders away from the basket', () => {
    const editor = createBasketballEditor();
    const defender = editor.elements.find(tool => tool.id === 'defender-1')!;
    const boardFor = (surface: string) => ({
      getDocument: () => ({ schema: 'sportsboard', version: 1, surface: { type: surface }, elements: [] })
    }) as unknown as SportsBoard;

    expect(defender.create({ x: .5, y: .5 }, boardFor(Basketball.surfaces.halfCourt)).rotation).toBe(180);
    expect(defender.create({ x: .5, y: .5 }, boardFor(Basketball.surfaces.fullCourt)).rotation).toBeUndefined();
  });
});

describe('basketball surfaces', () => {
  it.each([Basketball.surfaces.halfCourt, Basketball.surfaces.fullCourt])('keeps usable space outside %s', surfaceId => {
    const surface = createBasketballViewer().createRegistry().getSurface(surfaceId);
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
