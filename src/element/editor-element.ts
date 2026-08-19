import type { BoardDocument, BoardImageOptions } from '../core/index.js';
import { SportsBoardEditor } from '../editor/index.js';
import { createBasketballEditor } from '../sports/basketball/editor.js';
import type { BasketballMessages } from '../sports/basketball/i18n.js';
import { createFootballEditor } from '../sports/football/editor.js';
import type { FootballMessages } from '../sports/football/i18n.js';
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
  SportsBoardEditorElementOptions,
  SportsBoardElementChangeDetail,
  SportsBoardElementErrorDetail,
  SportsBoardElementReadyDetail,
  SportsBoardElementSaveDetail
} from './types.js';

const observedAttributes = ['sport', 'locale', 'surface', 'show-save', 'data', 'options'];

/** Complete editing interface for one built-in sport. */
export class SportsBoardEditorElement extends HTMLElementBase {
  static readonly formAssociated = true;
  static get observedAttributes(): string[] { return observedAttributes; }

  instance?: SportsBoardEditor;
  private elementOptions: SportsBoardEditorElementOptions = {};
  private documentData?: BoardDocument | string;
  private internals?: ElementInternals;
  private mountQueued = false;

  constructor() {
    super();
    this.internals = this.attachInternals?.();
  }

  connectedCallback(): void {
    mountElementStyles();
    upgradeProperty(this, 'options');
    upgradeProperty(this, 'data');
    upgradeProperty(this, 'value');
    this.scheduleMount();
  }

  disconnectedCallback(): void {
    this.mountQueued = false;
    this.destroy();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue || !this.isConnected) return;
    if (name === 'data') {
      this.documentData = newValue ? parseJSON<BoardDocument>(newValue, 'data attribute') : undefined;
      if (this.documentData !== undefined && this.instance) this.load(this.documentData);
      return;
    }
    this.scheduleMount();
  }

  get options(): SportsBoardEditorElementOptions {
    return {
      ...copyOptions(this.elementOptions),
      messages: this.elementOptions.messages ? { ...this.elementOptions.messages } : undefined,
      colorPalette: this.elementOptions.colorPalette?.map(color => ({ ...color }))
    };
  }

  set options(value: SportsBoardEditorElementOptions) {
    this.elementOptions = {
      ...copyOptions(value ?? {}),
      messages: value.messages ? { ...value.messages } : undefined,
      colorPalette: value.colorPalette?.map(color => ({ ...color }))
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

  getDocument(): BoardDocument | undefined { return this.instance?.getDocument(); }
  toJSON(pretty = false): string | undefined { return this.instance?.toJSON(pretty); }
  toCanvas(options?: BoardImageOptions): HTMLCanvasElement | undefined { return this.instance?.toCanvas(options); }
  toDataURL(options?: BoardImageOptions): string | undefined { return this.instance?.toDataURL(options); }
  toBlob(options?: BoardImageOptions): Promise<Blob> {
    if (!this.instance) return Promise.reject(new Error('SportsBoard editor is not mounted'));
    return this.instance.toBlob(options);
  }

  load(data: BoardDocument | string): void {
    this.documentData = clone(data);
    if (!this.instance) return this.scheduleMount();
    this.instance.load(data);
    this.documentData = this.instance.getDocument();
    this.syncFormValue();
  }

  mount(): SportsBoardEditor {
    const options = this.resolveOptions();
    const identity = resolveIdentity(this, options);
    const data = resolveElementData(this, this.documentData, options.data);
    const sport = identity.sport === 'football'
      ? createFootballEditor(identity.locale, options.sportMessages as Partial<FootballMessages>)
      : createBasketballEditor(identity.locale, options.sportMessages as Partial<BasketballMessages>);

    this.instance?.destroy();
    this.instance = new SportsBoardEditor(this, {
      data,
      sport,
      surface: identity.surface,
      locale: identity.locale,
      messages: options.messages,
      showSave: options.showSave,
      saveLabel: options.saveLabel,
      colorPalette: options.colorPalette,
      onSave: options.onSave
    });
    this.documentData = this.instance.getDocument();
    this.bindInstance(this.instance);
    this.syncFormValue();
    emit<SportsBoardElementReadyDetail>(this, 'ready', {
      document: this.instance.getDocument(), mode: 'editor', sport: identity.sport
    });
    return this.instance;
  }

  destroy(): void {
    this.instance?.destroy();
    this.instance = undefined;
    this.internals?.setFormValue(null);
  }

  private bindInstance(instance: SportsBoardEditor): void {
    instance.addEventListener('viewportchange', event => emit(this, 'viewportchange', (event as CustomEvent).detail));
    instance.addEventListener('change', event => {
      const document = (event as CustomEvent<{ document: BoardDocument }>).detail.document;
      this.documentData = document;
      this.syncFormValue();
      emit<SportsBoardElementChangeDetail>(this, 'change', { document, json: JSON.stringify(document) });
    });
    instance.addEventListener('save', event => {
      const detail = (event as CustomEvent<SportsBoardElementSaveDetail>).detail;
      this.documentData = detail.document;
      this.syncFormValue();
      emit<SportsBoardElementSaveDetail>(this, 'save', detail);
    });
    instance.addEventListener('status', event => emit(this, 'status', (event as CustomEvent).detail));
  }

  private resolveOptions(): SportsBoardEditorElementOptions {
    const serialized = this.getAttribute('options');
    const attributeOptions = serialized ? parseJSON<SportsBoardEditorElementOptions>(serialized, 'options attribute') : {};
    return {
      ...attributeOptions,
      ...this.elementOptions,
      showSave: booleanAttribute(this, 'show-save') ?? this.elementOptions.showSave ?? attributeOptions.showSave
    };
  }

  private scheduleMount(): void {
    if (!this.isConnected || this.mountQueued) return;
    this.mountQueued = true;
    queueMicrotask(() => {
      this.mountQueued = false;
      if (!this.isConnected) return;
      try { this.mount(); }
      catch (value) {
        const error = value instanceof Error ? value : new Error(String(value));
        emit<SportsBoardElementErrorDetail>(this, 'error', { error });
      }
    });
  }

  private syncFormValue(): void { this.internals?.setFormValue(this.toJSON() ?? ''); }
}

export function defineSportsBoardEditorElement(tagName = 'sports-board-editor'): void {
  if (!globalThis.customElements) throw new Error('Custom elements are not available in this environment');
  if (!customElements.get(tagName)) customElements.define(tagName, SportsBoardEditorElement);
}
