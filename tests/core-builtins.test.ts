import Konva from 'konva';
import { describe, expect, it } from 'vitest';
import { CoreElements, Registry, registerBuiltins, type BoardDocument, type BoardElement, type RenderContext } from '../src/core/index.js';
import { createCoreEditorTools, movementConversionPatch } from '../src/editor/generic-tools.js';
import { shouldRefreshColorPalette } from '../src/editor/change.js';
import { resolveEditorMessages } from '../src/editor/i18n.js';

const context: RenderContext = {
  width: 800,
  height: 500,
  resolveEndpoint: endpoint => 'element' in endpoint ? { x: .5, y: .5 } : endpoint
};

describe('core visual elements', () => {
  it('registers shared annotations and training equipment as non-connectable elements', () => {
    const registry = registerBuiltins(new Registry());
    for (const type of [
      CoreElements.zone,
      CoreElements.text,
      CoreElements.marker,
      CoreElements.hurdle,
      CoreElements.pole
    ]) {
      expect(registry.getElement(type).connectable).toBe(false);
    }
    expect(registry.getElement(CoreElements.zone).layer).toBe('background');
    expect(registry.getElement(CoreElements.text).layer).toBe('annotations');
    expect(registry.getElement(CoreElements.connector).connectable).toBe(false);
    expect(registry.getElement(CoreElements.zone).resize).toEqual({ minWidth: .08, minHeight: .06, maxWidth: .9, maxHeight: .9, keepRatio: false });
    expect(registry.getElement(CoreElements.zone).render({ id: 'zone', type: CoreElements.zone, x: .5, y: .5 }, context)).toBeInstanceOf(Konva.Group);
    expect(registry.getElement(CoreElements.hurdle).render({ id: 'hurdle', type: CoreElements.hurdle, x: .5, y: .5 }, context)).toBeInstanceOf(Konva.Group);
    expect(() => registry.getElement('core.highlight-circle')).toThrow('Unknown element type');
    expect(() => registry.getElement('core.highlight-rectangle')).toThrow('Unknown element type');
    expect(() => registry.getElement('core.line')).toThrow('Unknown element type');
  });
});

describe('generic editor tools', () => {
  it('exposes localized tools to every sport editor', () => {
    const tools = createCoreEditorTools(resolveEditorMessages('fr'), 'objects');

    expect(tools.groups.map(group => group.label)).toEqual(['Annotations']);
    expect(tools.elements.find(tool => tool.type === CoreElements.hurdle)?.label).toBe('Haie');
    expect(tools.elements.find(tool => tool.type === CoreElements.hurdle)?.group).toBe('objects');
    expect(tools.elements.find(tool => tool.type === CoreElements.pole)?.label).toBe('Jalon');
    expect(tools.connectors).toEqual([]);
  });

  it('converts movement styling without dropping its label or custom color', () => {
    const movement: BoardElement = {
      id: 'movement',
      type: CoreElements.connector,
      from: { element: 'player-1' },
      to: { x: .8, y: .2 },
      waypoints: [{ x: .6, y: .4 }],
      style: { color: '#7c3aed', line: 'solid' },
      data: { movement: 'run', label: 'Cut' }
    };

    expect(movementConversionPatch(movement, 'dribble')).toEqual({
      style: { color: '#7c3aed', line: 'wavy' },
      data: { movement: 'dribble', label: 'Cut' }
    });
  });

  it('skips color palette work for note-only metadata changes', () => {
    const document: BoardDocument = { schema: 'sportsboard', version: 1, surface: { type: 'test.surface' }, elements: [] };

    expect(shouldRefreshColorPalette({ document, kind: 'meta' })).toBe(false);
    expect(shouldRefreshColorPalette({ document, kind: 'content' })).toBe(true);
    expect(shouldRefreshColorPalette({ document, kind: 'surface' })).toBe(true);
  });
});
