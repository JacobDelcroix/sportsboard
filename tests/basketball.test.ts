import { describe, expect, it } from 'vitest';
import { validateBoardDocument, type BoardDocument } from '../src/core/index.js';
import { Basketball, createBasketballViewer } from '../src/sports/basketball/viewer-entry.js';
import { createBasketballEditor } from '../src/sports/basketball/editor.js';

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
    expect(basket.defaults?.width).toBe(.17);
    expect(basket.defaults?.height).toBe(.09);
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
});
