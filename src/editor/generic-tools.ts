import { CoreElements, type BoardElement, type Point } from '../core/index.js';
import type { EditorConnectorTool, EditorElementTool, EditorMessages, EditorToolGroup } from './types.js';

export type ConvertibleMovement = 'run' | 'dribble' | 'pass';

export interface CoreEditorTools {
  groups: EditorToolGroup[];
  elements: EditorElementTool[];
  connectors: EditorConnectorTool[];
}

const positioned = (type: string, data?: Record<string, unknown>) => (point: Point) => data
  ? { type, ...point, data }
  : { type, ...point };

/** Creates the generic annotation and training-equipment tools shared by every sport editor. */
export function createCoreEditorTools(messages: EditorMessages, equipmentGroup = 'generic-equipment'): CoreEditorTools {
  return {
    groups: [
      { id: 'annotations', label: messages.annotations, layout: 'grid' },
      ...(equipmentGroup === 'generic-equipment'
        ? [{ id: equipmentGroup, label: messages.genericEquipment, layout: 'grid' as const }]
        : [])
    ],
    elements: [
      { id: 'zone', type: CoreElements.zone, group: 'annotations', label: messages.zone, icon: '▨', create: positioned(CoreElements.zone) },
      { id: 'text', type: CoreElements.text, group: 'annotations', label: messages.freeText, icon: 'T', create: positioned(CoreElements.text, { text: messages.textDefault }) },
      { id: 'marker', type: CoreElements.marker, group: 'annotations', label: messages.freeMarker, icon: 'A', create: positioned(CoreElements.marker, { text: 'A' }) },
      { id: 'hurdle', type: CoreElements.hurdle, group: equipmentGroup, label: messages.hurdle, icon: '⌑', create: positioned(CoreElements.hurdle) },
      { id: 'pole', type: CoreElements.pole, group: equipmentGroup, label: messages.pole, icon: '│', create: positioned(CoreElements.pole) }
    ],
    connectors: []
  };
}

/** Changes a movement's visual kind while preserving its route, attachments, color, and optional label. */
export function movementConversionPatch(
  element: BoardElement,
  movement: ConvertibleMovement
): Pick<BoardElement, 'style' | 'data'> {
  const line = movement === 'dribble' ? 'wavy' : movement === 'pass' ? 'dashed' : 'solid';
  return {
    style: { ...element.style, line },
    data: { ...element.data, movement }
  };
}
