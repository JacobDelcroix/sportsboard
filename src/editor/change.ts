import type { BoardChangeDetail } from '../core/index.js';

/** Metadata-only edits cannot introduce, remove, or update document colors. */
export function shouldRefreshColorPalette(detail: BoardChangeDetail): boolean {
  return detail.kind !== 'meta';
}
