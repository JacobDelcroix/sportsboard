import type { BoardDocument, BoardImageOptions } from '../core/index.js';
import type { SportsBoardThumbnailOptions } from './types.js';
import { SportsBoardViewer } from './viewer.js';

const parseDocument = (data: BoardDocument | string): BoardDocument =>
  typeof data === 'string' ? JSON.parse(data) as BoardDocument : data;

const nextPaint = (): Promise<void> => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

async function withThumbnailViewer<T>(options: SportsBoardThumbnailOptions, exporter: (viewer: SportsBoardViewer, image: BoardImageOptions) => T | Promise<T>): Promise<T> {
  const document = parseDocument(options.data);
  const width = Math.max(1, Math.round(options.width ?? 640));
  const surface = options.sport.createRegistry().getSurface(document.surface.type);
  const height = Math.max(1, Math.round(width / surface.ratio));
  const target = window.document.createElement('div');
  target.setAttribute('aria-hidden', 'true');
  Object.assign(target.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    width: `${width}px`,
    height: `${height}px`,
    overflow: 'hidden',
    pointerEvents: 'none',
    visibility: 'hidden'
  });
  window.document.body.append(target);
  let viewer: SportsBoardViewer | undefined;
  try {
    viewer = new SportsBoardViewer(target, {
      data: document,
      sport: options.sport,
      width,
      height,
      controls: false,
      interactive: false
    });
    await window.document.fonts?.ready;
    await nextPaint();
    return await exporter(viewer, { width, type: options.type ?? 'image/webp', quality: options.quality ?? .85 });
  } finally {
    viewer?.destroy();
    target.remove();
  }
}

/** Produces an upload-ready file without keeping a canvas in the page. */
export function renderSportsBoardThumbnail(options: SportsBoardThumbnailOptions): Promise<Blob> {
  return withThumbnailViewer(options, (viewer, image) => viewer.toBlob(image));
}

/** Produces a data URL for immediate previews. Blob storage is recommended for persistence. */
export function renderSportsBoardThumbnailDataURL(options: SportsBoardThumbnailOptions): Promise<string> {
  return withThumbnailViewer(options, (viewer, image) => viewer.toDataURL(image));
}
