export interface WheelModifiers {
  ctrlKey: boolean;
  metaKey: boolean;
}

/** Leaves normal wheel gestures to the surrounding page. */
export function requestsWheelZoom(event: WheelModifiers): boolean {
  return event.metaKey || event.ctrlKey;
}
