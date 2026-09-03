import { SportsBoard, type BoardDocument, type BoardImageOptions } from '../core/index.js';
import { mountViewerStyles } from './styles.js';
import { resolveViewerMessages } from './i18n.js';
import type { SportsBoardCanvasOptions, ViewerMessages } from './types.js';

const FORWARDED_EVENTS = ['change', 'modechange', 'selectionchange', 'viewportchange'] as const;

/** Konva canvas shared by the viewer and editor packages. */
export class SportsBoardCanvas extends EventTarget {
  readonly target: HTMLElement;
  readonly board: SportsBoard;
  private root: HTMLDivElement;
  private stageHost: HTMLDivElement;
  private messages: ViewerMessages;

  constructor(target: string | HTMLElement, options: SportsBoardCanvasOptions) {
    super();
    const element = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    if (!element) throw new Error('SportsBoardCanvas target was not found');
    this.target = element;
    const { registry, controls = false, locale = 'en', messages, ...boardOptions } = options;
    this.messages = resolveViewerMessages(locale, messages);
    mountViewerStyles();
    this.root = document.createElement('div');
    this.root.className = 'sb-canvas';
    this.root.dataset.fit = boardOptions.mode === 'viewer' ? 'contain' : 'width';
    this.stageHost = document.createElement('div');
    this.stageHost.className = 'sb-canvas__stage';
    this.root.append(this.stageHost);
    this.target.replaceChildren(this.root);
    this.board = new SportsBoard(this.stageHost, boardOptions, registry);
    this.applySurfaceRatio();
    if (controls) this.mountViewportControls();
    for (const name of FORWARDED_EVENTS) {
      this.board.addEventListener(name, event => {
        this.dispatchEvent(new CustomEvent(name, { detail: (event as CustomEvent).detail }));
      });
    }
  }

  getBoard(): SportsBoard { return this.board; }
  getDocument(): BoardDocument { return this.board.getDocument(); }
  toJSON(pretty = false): string { return this.board.toJSON(pretty); }
  toCanvas(options?: BoardImageOptions): HTMLCanvasElement { return this.board.toCanvas(options); }
  toDataURL(options?: BoardImageOptions): string { return this.board.toDataURL(options); }
  toBlob(options?: BoardImageOptions): Promise<Blob> { return this.board.toBlob(options); }
  load(data: BoardDocument | string): void { this.board.load(data); this.applySurfaceRatio(); }
  destroy(): void { this.board.destroy(); this.target.replaceChildren(); }

  private applySurfaceRatio(): void {
    const surface = this.board.registry.getSurface(this.board.getDocument().surface.type);
    this.root.style.setProperty('--sb-surface-ratio', String(surface.ratio));
  }

  private mountViewportControls(): void {
    const controls = document.createElement('div');
    controls.className = 'sb-canvas__viewport-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', this.messages.navigationLabel);
    controls.innerHTML = `
      <button type="button" data-viewport-action="zoom-out">−</button>
      <output class="sb-canvas__zoom-value" aria-live="polite">100 %</output>
      <button type="button" data-viewport-action="zoom-in">+</button>
      <button type="button" data-viewport-action="reset">⌖</button>`;
    const zoomOut = controls.querySelector<HTMLButtonElement>('[data-viewport-action="zoom-out"]')!;
    const zoomIn = controls.querySelector<HTMLButtonElement>('[data-viewport-action="zoom-in"]')!;
    const reset = controls.querySelector<HTMLButtonElement>('[data-viewport-action="reset"]')!;
    const value = controls.querySelector<HTMLOutputElement>('.sb-canvas__zoom-value')!;
    zoomOut.title = zoomOut.ariaLabel = this.messages.zoomOut;
    zoomIn.title = zoomIn.ariaLabel = this.messages.zoomIn;
    reset.title = reset.ariaLabel = this.messages.resetViewport;
    const update = (): void => {
      const { zoom, pan } = this.board.getUIState();
      value.value = `${Math.round(zoom * 100)} %`;
      zoomOut.disabled = zoom <= 1;
      zoomIn.disabled = zoom >= 2;
      reset.disabled = zoom <= 1 && pan.x === 0 && pan.y === 0;
    };
    zoomOut.addEventListener('click', () => this.board.setZoom(this.board.getUIState().zoom - .25));
    zoomIn.addEventListener('click', () => this.board.setZoom(this.board.getUIState().zoom + .25));
    reset.addEventListener('click', () => this.board.resetViewport());
    this.board.addEventListener('viewportchange', update);
    this.root.append(controls);
    update();
  }
}
