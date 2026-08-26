export interface WheelModifiers {
  ctrlKey: boolean;
  metaKey: boolean;
}

export interface TransformerBox {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface ResizeBounds {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
}

/** Leaves normal wheel gestures to the surrounding page. */
export function requestsWheelZoom(event: WheelModifiers): boolean {
  return event.metaKey || event.ctrlKey;
}

/** Limits resize handles without intercepting the independent rotation handle. */
export function constrainTransformerBox(
  oldBox: TransformerBox,
  nextBox: TransformerBox,
  bounds: ResizeBounds | undefined,
  stageWidth: number,
  stageHeight: number,
  zoom: number
): TransformerBox {
  if (!bounds || oldBox.rotation !== nextBox.rotation) return nextBox;
  const width = Math.abs(nextBox.width);
  const height = Math.abs(nextBox.height);
  if (
    width < bounds.minWidth * stageWidth * zoom
    || height < bounds.minHeight * stageHeight * zoom
    || width > bounds.maxWidth * stageWidth * zoom
    || height > bounds.maxHeight * stageHeight * zoom
  ) return oldBox;
  return nextBox;
}
