import type { BoardDocument, BoardImageOptions } from '../core/index.js';
import { SportsBoardCanvas } from './canvas.js';
import { resolveViewerMessages } from './i18n.js';
import type { SportsBoardViewerOptions } from './types.js';

const parseDocument = (data?: BoardDocument | string): BoardDocument | undefined =>
  typeof data === 'string' ? JSON.parse(data) as BoardDocument : data;

/** Canvas-only viewer that accepts a document and prevents all mutations. */
export class SportsBoardViewer extends EventTarget {
  readonly target: HTMLElement;
  private options: SportsBoardViewerOptions;
  private root: HTMLDivElement;
  private boardHost: HTMLDivElement;
  private canvas: SportsBoardCanvas;

  constructor(target: string | HTMLElement, options: SportsBoardViewerOptions) {
    super();
    const element = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    if (!element) throw new Error('SportsBoardViewer target was not found');
    this.target = element;
    this.options = options;
    this.root = document.createElement('div');
    this.root.className = 'sb-viewer sb-viewer--standalone';
    this.root.setAttribute('aria-label', resolveViewerMessages(options.locale, options.messages).boardLabel);
    this.boardHost = document.createElement('div');
    this.boardHost.className = 'sb-viewer__board';
    this.root.append(this.boardHost);
    this.target.replaceChildren(this.root);
    this.canvas = this.createCanvas(options.data);
  }

  getBoard() { return this.canvas.getBoard(); }
  getDocument(): BoardDocument { return this.canvas.getDocument(); }
  toJSON(pretty = false): string { return this.canvas.toJSON(pretty); }
  toCanvas(options?: BoardImageOptions): HTMLCanvasElement { return this.canvas.toCanvas(options); }
  toDataURL(options?: BoardImageOptions): string { return this.canvas.toDataURL(options); }
  toBlob(options?: BoardImageOptions): Promise<Blob> { return this.canvas.toBlob(options); }

  load(data: BoardDocument | string): void {
    this.assertCompatible(parseDocument(data));
    this.canvas.load(data);
  }

  destroy(): void {
    this.canvas.destroy();
    this.target.replaceChildren();
  }

  private createCanvas(data?: BoardDocument | string): SportsBoardCanvas {
    const document = parseDocument(data);
    this.assertCompatible(document);
    const surface = document?.surface.type ?? this.options.surface ?? this.options.sport.surfaces[0]?.id;
    if (!surface) throw new Error(`SportsBoardViewer sport '${this.options.sport.id}' has no surface`);
    const canvas = new SportsBoardCanvas(this.boardHost, {
      mode: 'viewer',
      data: document,
      surface,
      width: this.options.width,
      height: this.options.height,
      controls: this.options.controls ?? (this.options.interactive ?? true),
      interactive: this.options.interactive,
      locale: this.options.locale,
      messages: this.options.messages,
      registry: this.options.sport.createRegistry()
    });
    canvas.addEventListener('viewportchange', event => this.dispatchEvent(new CustomEvent('viewportchange', { detail: (event as CustomEvent).detail })));
    return canvas;
  }

  private assertCompatible(document?: BoardDocument): void {
    if (!document) return;
    const compatible = this.options.sport.surfaces.some(surface => surface.id === document.surface.type);
    if (!compatible) throw new Error(`Surface '${document.surface.type}' is not provided by sport '${this.options.sport.id}'`);
  }
}
