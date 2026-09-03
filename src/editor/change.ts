import type { BoardChangeDetail, BoardElement, ElementInput, Registry } from '../core/index.js';

/** Metadata-only edits cannot introduce, remove, or update document colors. */
export function shouldRefreshColorPalette(detail: BoardChangeDetail): boolean {
  return detail.kind !== 'meta';
}

/** Attaches a newly inserted magnetic element when the current selection is a compatible target. */
export function attachToSelectedMagnetTarget(input: ElementInput, selected: BoardElement | undefined, registry: Registry): ElementInput {
  if (!selected || selected.x === undefined || selected.y === undefined || input.attachment) return input;
  const magnet = registry.getElement(input.type).magnet;
  if (!magnet?.targetTypes.includes(selected.type)) return input;

  const anchors = magnet.anchors?.length ? [...magnet.anchors] : [{ x: .08, y: .28 }, { x: .92, y: .28 }];
  anchors.sort((left, right) => left.x - right.x);
  const localRightIsWorldRight = Math.cos((selected.rotation ?? 0) * Math.PI / 180) >= 0;
  const preferWorldRight = selected.x <= .5;
  const anchor = preferWorldRight === localRightIsWorldRight ? anchors[anchors.length - 1] : anchors[0];

  return {
    ...input,
    x: selected.x,
    y: selected.y,
    attachment: { element: selected.id, anchor: { ...anchor } }
  };
}

/** Returns a predictable 0-359 degree rotation after one keyboard step. */
export function steppedRotation(rotation: number | undefined, direction: -1 | 1, step = 10): number {
  const next = ((rotation ?? 0) + direction * step) % 360;
  return next < 0 ? next + 360 : next;
}
