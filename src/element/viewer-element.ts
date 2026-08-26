import type { BoardDocument, BoardImageOptions } from '../core/index.js';
import { createBasketballViewer } from '../sports/basketball/viewer.js';
import type { BasketballMessages } from '../sports/basketball/i18n.js';
import { createFootballViewer } from '../sports/football/viewer.js';
import type { FootballMessages } from '../sports/football/i18n.js';
import { resolveViewerMessages, SportsBoardCanvas, type SportsBoardCanvasOptions } from '../viewer/index.js';
import { mountElementStyles } from './styles.js';
import {
  booleanAttribute,
  clone,
  copyOptions,
  emit,
  HTMLElementBase,
  parseJSON,
  resolveElementData,
  resolveIdentity,
  upgradeProperty
} from './shared.js';
import type {
  SportsBoardElementErrorDetail,
  SportsBoardElementReadyDetail,
  SportsBoardViewerElementOptions
} from './types.js';

const observedAttributes = ['sport', 'locale', 'surface', 'controls', 'interactive', 'data', 'options'];

/** Canvas-only custom element for a built-in sport. */
export class SportsBoardViewerElement extends HTMLElementBase {
  static get observedAttributes(): string[] { return observedAttributes; }

  instance?: SportsBoardCanvas;
  private elementOptions: SportsBoardViewerElementOptions = {};
  private documentData?: BoardDocument | string;
  private mountQueued = false;
  private managedByEditor = false;

  connectedCallback(): void {
    mountElementStyles();
    upgradeProperty(this, 'options');
    upgradeProperty(this, 'data');
    upgradeProperty(this, 'value');
    if (!this.managedByEditor) this.scheduleMount();
  }

  disconnectedCallback(): void {
    this.mountQueued = false;
    this.destroy();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue || !this.isConnected || this.managedByEditor) return;
    if (name === 'data') {
      try {
        this.documentData = newValue ? parseJSON<BoardDocument>(newValue, 'data attribute') : undefined;
        if (this.documentData !== undefined && this.instance) this.load(this.documentData);
        else this.scheduleMount();
      } catch (value) { this.emitError(value); }
      return;
    }
    this.scheduleMount();
  }

  get options(): SportsBoardViewerElementOptions {
    return {
      ...copyOptions(this.elementOptions),
      messages: this.elementOptions.messages ? { ...this.elementOptions.messages } : undefined
    };
  }

  set options(value: SportsBoardViewerElementOptions) {
    this.managedByEditor = false;
    this.elementOptions = {
      ...copyOptions(value ?? {}),
      messages: value.messages ? { ...value.messages } : undefined
    };
    if (Object.hasOwn(this.elementOptions, 'data')) this.documentData = this.elementOptions.data;
    this.scheduleMount();
  }

  get data(): BoardDocument | string | undefined {
    if (this.instance) return this.instance.getDocument();
    return this.documentData === undefined ? undefined : clone(this.documentData);
  }

  set data(value: BoardDocument | string | undefined) {
    this.documentData = value === undefined ? undefined : clone(value);
    if (value !== undefined && this.instance) this.load(value);
    else this.scheduleMount();
  }

  get value(): string { return this.toJSON() ?? ''; }
  set value(value: string) { this.load(value); }

  getBoard() { return this.instance?.getBoard(); }
  getDocument(): BoardDocument | undefined { return this.instance?.getDocument(); }
  toJSON(pretty = false): string | undefined { return this.instance?.toJSON(pretty); }
  toCanvas(options?: BoardImageOptions): HTMLCanvasElement | undefined { return this.instance?.toCanvas(options); }
  toDataURL(options?: BoardImageOptions): string | undefined { return this.instance?.toDataURL(options); }
  toBlob(options?: BoardImageOptions): Promise<Blob> {
    if (!this.instance) return Promise.reject(new Error('SportsBoard viewer is not mounted'));
    return this.instance.toBlob(options);
  }

  load(data: BoardDocument | string): void {
    this.documentData = clone(data);
    if (!this.instance) return this.scheduleMount();
    this.instance.load(data);
    this.documentData = this.instance.getDocument();
  }

  mount(): SportsBoardCanvas {
    this.managedByEditor = false;
    const options = this.resolveOptions();
    const identity = resolveIdentity(this, options);
    const data = resolveElementData(this, this.documentData, options.data);
    const sport = identity.sport === 'football'
      ? createFootballViewer(identity.locale, options.sportMessages as Partial<FootballMessages>)
      : createBasketballViewer(identity.locale, options.sportMessages as Partial<BasketballMessages>);
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', resolveViewerMessages(identity.locale, options.messages).boardLabel);
    }
    const document = typeof data === 'string' ? parseJSON<BoardDocument>(data, 'document') : data;
    if (document && !sport.surfaces.some(surface => surface.id === document.surface.type)) {
      throw new Error(`Sport '${sport.id}' does not support surface '${document.surface.type}'`);
    }
    const canvas = this.mountCanvas({
      mode: 'viewer',
      data: document,
      surface: identity.surface,
      controls: options.controls ?? (options.interactive ?? true),
      interactive: options.interactive,
      locale: identity.locale,
      messages: options.messages,
      registry: sport.createRegistry()
    }, false);
    this.documentData = canvas.getDocument();
    emit<SportsBoardElementReadyDetail>(this, 'ready', {
      document: canvas.getDocument(), mode: 'viewer', sport: identity.sport
    });
    return canvas;
  }

  /** Internal composition API used by the editor to mount its editable canvas. */
  mountCanvas(options: SportsBoardCanvasOptions, managedByEditor = true): SportsBoardCanvas {
    this.managedByEditor = managedByEditor;
    this.instance?.destroy();
    const root = document.createElement('div');
    root.className = 'sb-viewer';
    const board = document.createElement('div');
    board.className = 'sb-viewer__board';
    root.append(board);
    this.replaceChildren(root);
    this.instance = new SportsBoardCanvas(board, options);
    for (const name of ['change', 'modechange', 'selectionchange', 'viewportchange'] as const) {
      this.instance.addEventListener(name, event => {
        this.dispatchEvent(new CustomEvent(name, {
          detail: (event as CustomEvent).detail,
          bubbles: !managedByEditor,
          composed: true
        }));
      });
    }
    return this.instance;
  }

  destroy(): void {
    this.instance?.destroy();
    this.instance = undefined;
    this.replaceChildren();
  }

  private resolveOptions(): SportsBoardViewerElementOptions {
    const serialized = this.getAttribute('options');
    const attributeOptions = serialized ? parseJSON<SportsBoardViewerElementOptions>(serialized, 'options attribute') : {};
    return {
      ...attributeOptions,
      ...this.elementOptions,
      controls: booleanAttribute(this, 'controls') ?? this.elementOptions.controls ?? attributeOptions.controls,
      interactive: booleanAttribute(this, 'interactive') ?? this.elementOptions.interactive ?? attributeOptions.interactive
    };
  }

  private scheduleMount(): void {
    if (!this.isConnected || this.mountQueued || this.managedByEditor) return;
    this.mountQueued = true;
    queueMicrotask(() => {
      this.mountQueued = false;
      if (!this.isConnected || this.managedByEditor) return;
      try { this.mount(); }
      catch (value) { this.emitError(value); }
    });
  }

  private emitError(value: unknown): void {
    const error = value instanceof Error ? value : new Error(String(value));
    emit<SportsBoardElementErrorDetail>(this, 'error', { error });
  }
}

export function defineSportsBoardViewerElement(tagName = 'sports-board-viewer'): void {
  if (!globalThis.customElements) throw new Error('Custom elements are not available in this environment');
  if (!customElements.get(tagName)) customElements.define(tagName, SportsBoardViewerElement);
}
