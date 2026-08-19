import { type SportsBoard, type BoardDocument, type BoardElement, type BoardImageOptions, type Endpoint, type Point, validateBoardDocument } from '../core/index.js';
import { defineSportsBoardViewerElement, SportsBoardViewerElement } from '../element/viewer-element.js';
import { SportsBoardCanvas } from '../viewer/index.js';
import { createClipboardElement } from './clipboard.js';
import { resolveEditorMessages } from './i18n.js';
import { mountEditorStyles } from './styles.js';
import type { EditorConnectorTool, EditorElementTool, EditorMessages, EditorSaveDetail, EditorSportDefinition, SportsBoardEditorOptions } from './types.js';

const clone = <T>(value: T): T => structuredClone(value);
const parseDocument = (data?: BoardDocument | string): BoardDocument | undefined => data === undefined ? undefined : clone(typeof data === 'string' ? JSON.parse(data) as BoardDocument : data);
const DEFAULT_COLORS = [
  { value: '#0f172a', label: 'Slate 900' }, { value: '#475569', label: 'Slate 600' },
  { value: '#dc2626', label: 'Red 600' }, { value: '#f97316', label: 'Orange 500' },
  { value: '#f59e0b', label: 'Amber 500' }, { value: '#eab308', label: 'Yellow 500' },
  { value: '#65a30d', label: 'Lime 600' }, { value: '#10b981', label: 'Emerald 500' },
  { value: '#14b8a6', label: 'Teal 500' }, { value: '#0891b2', label: 'Cyan 600' },
  { value: '#2563eb', label: 'Blue 600' }, { value: '#4f46e5', label: 'Indigo 600' },
  { value: '#7c3aed', label: 'Violet 600' }, { value: '#d946ef', label: 'Fuchsia 500' },
  { value: '#ec4899', label: 'Pink 500' }
] as const;
const isColor = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
const colorChannels = (color: string): [number, number, number] => [1, 3, 5].map(index => Number.parseInt(color.slice(index, index + 2), 16)) as [number, number, number];
const colorsAreClose = (left: string, right: string): boolean => {
  if (!isColor(left) || !isColor(right)) return left.toLowerCase() === right.toLowerCase();
  const a = colorChannels(left);
  const b = colorChannels(right);
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 32;
};
const uniqueColors = <T extends { value: string }>(colors: T[], excluded: string[] = []): T[] => {
  const result: T[] = [];
  for (const color of colors) if (!excluded.some(value => colorsAreClose(value, color.value)) && !result.some(value => colorsAreClose(value.value, color.value))) result.push(color);
  return result;
};
const icon = (paths: string): string => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths}</svg>`;
const ICONS = {
  undo: icon('<path d="M9 7 4 12l5 5"/><path d="M5 12h8a6 6 0 0 1 6 6"/>'),
  redo: icon('<path d="m15 7 5 5-5 5"/><path d="M19 12h-8a6 6 0 0 0-6 6"/>'),
  delete: icon('<path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/>'),
  clear: icon('<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>'),
  notes: icon('<path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4M9 11h6M9 15h6"/>'),
  help: icon('<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 3.5 2.1c-.9.5-1.3 1-1.3 1.9"/><path d="M12 17h.01"/>'),
  close: icon('<path d="m7 7 10 10M17 7 7 17"/>'),
  save: icon('<path d="M5 4h12l2 2v14H5z"/><path d="M8 4v6h8V4M8 20v-6h8v6"/>'),
  tools: icon('<path d="M4 7h10M18 7h2M4 17h2m4 0h10M14 4v6M10 14v6"/>'),
  board: icon('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16M3 12h18"/>'),
  inspector: icon('<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>')
} as const;

type MobilePanel = 'tools' | 'board' | 'inspector';

export class SportsBoardEditor extends EventTarget {
  readonly target: HTMLElement;
  private options: SportsBoardEditorOptions;
  private sport: EditorSportDefinition;
  private root!: HTMLDivElement;
  private boardHost!: HTMLDivElement;
  private canvas!: SportsBoardCanvas;
  private canvasElement?: SportsBoardViewerElement;
  private board!: SportsBoard;
  private selectedId: string | null = null;
  private draggedElement: EditorElementTool | null = null;
  private selectedColor = '#2563eb';
  private messages: EditorMessages;
  private notesHistoryOpen = false;
  private clipboard?: { element: BoardElement; document: BoardDocument };
  private pasteCount = 0;
  private toastTimer?: ReturnType<typeof setTimeout>;

  constructor(target: string | HTMLElement, options: SportsBoardEditorOptions) {
    super();
    const element = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    if (!element) throw new Error('SportsBoardEditor target was not found');
    if (!options.sport) throw new Error('SportsBoardEditor requires one sport definition');
    this.target = element;
    this.options = options;
    this.messages = resolveEditorMessages(options.locale, options.messages);
    if (options.saveLabel) this.messages.save = options.saveLabel;
    const initialDocument = parseDocument(options.data);
    this.sport = options.sport;
    if (initialDocument && !this.supportsSurface(initialDocument.surface.type)) {
      throw new Error(`Sport '${this.sport.id}' does not support surface '${initialDocument.surface.type}'`);
    }
    this.render(initialDocument);
  }

  getBoard(): SportsBoard { return this.board; }
  getDocument(): BoardDocument { this.flushNotes(); return this.board.getDocument(); }
  toJSON(pretty = false): string { this.flushNotes(); return this.board.toJSON(pretty); }
  toCanvas(options?: BoardImageOptions): HTMLCanvasElement { this.flushNotes(); return this.canvas.toCanvas(options); }
  toDataURL(options?: BoardImageOptions): string { this.flushNotes(); return this.canvas.toDataURL(options); }
  toBlob(options?: BoardImageOptions): Promise<Blob> { this.flushNotes(); return this.canvas.toBlob(options); }

  load(data: BoardDocument | string): void {
    const document = parseDocument(data)!;
    if (!this.supportsSurface(document.surface.type)) throw new Error(`Sport '${this.sport.id}' does not support surface '${document.surface.type}'`);
    validateBoardDocument(document, this.sport.createRegistry());
    this.flushNotes();
    this.render(document);
  }

  destroy(): void {
    this.flushNotes();
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.canvasElement?.destroy();
    this.canvasElement = undefined;
    this.target.replaceChildren();
  }

  private supportsSurface(surface: string): boolean { return this.sport.surfaces.some(item => item.id === surface); }

  private render(data?: BoardDocument): void {
    this.flushNotes();
    this.canvasElement?.destroy();
    this.canvasElement = undefined;
    this.selectedId = null;
    this.draggedElement = null;
    this.notesHistoryOpen = false;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    mountEditorStyles();
    this.root = document.createElement('div');
    this.root.className = 'sb-editor';
    this.root.dataset.mobilePanel = 'board';
    this.target.replaceChildren(this.root);
    this.buildEditor(data);
  }

  private buildEditor(data?: BoardDocument): void {
    this.root.innerHTML = `
      <header class="sb-editor__toolbar">
        <div class="sb-editor__surfaces"></div>
        <div class="sb-editor__actions">
          <button type="button" class="sb-editor__icon-button" data-action="undo">${ICONS.undo}</button>
          <button type="button" class="sb-editor__icon-button" data-action="redo">${ICONS.redo}</button>
          <button type="button" class="sb-editor__icon-button" data-action="delete">${ICONS.delete}</button>
          <button type="button" class="sb-editor__icon-button" data-action="clear">${ICONS.clear}</button>
        </div>
        <div class="sb-editor__toolbar-spacer"></div>
        <button type="button" class="sb-editor__notes-button" data-action="notes">${ICONS.notes}<span></span><i aria-hidden="true"></i></button>
        <button type="button" class="sb-editor__icon-button sb-editor__help-button" data-action="help">${ICONS.help}</button>
        <button type="button" class="sb-editor__save" data-action="save">${ICONS.save}<span></span></button>
      </header>
      <div class="sb-editor__body">
        <aside class="sb-editor__toolbox"></aside>
        <section class="sb-editor__workspace">
          <div class="sb-editor__board-frame">
            <div class="sb-editor__board" tabindex="0"></div>
          </div>
        </section>
        <aside class="sb-editor__inspector">
          <section class="sb-editor__section"><h2 class="sb-editor__section-title" data-label="properties"></h2>
            <fieldset class="sb-editor__fields" disabled>
              <label class="sb-editor__field" data-field="number"><span></span><input type="number" min="0" max="99" step="1"></label>
              <div class="sb-editor__field" data-field="color"><span></span><div class="sb-editor__color-picker"></div></div>
            </fieldset>
          </section>
          <section class="sb-editor__section sb-editor__route" data-section="route" hidden>
            <h2 class="sb-editor__section-title" data-label="route"></h2>
            <button type="button" class="sb-editor__secondary-button" data-action="add-waypoint"></button>
            <p class="sb-editor__hint"></p>
          </section>
        </aside>
      </div>
      <nav class="sb-editor__mobile-nav">
        <button type="button" data-panel="tools">${ICONS.tools}<span></span></button>
        <button type="button" data-panel="board" class="is-active">${ICONS.board}<span></span></button>
        <button type="button" data-panel="inspector">${ICONS.inspector}<span></span><i aria-hidden="true"></i></button>
      </nav>
      <div class="sb-editor__toast" role="status" aria-live="polite" hidden></div>
      <div class="sb-editor__notes-overlay" hidden>
        <div class="sb-editor__notes-backdrop" data-action="close-notes" aria-hidden="true"></div>
        <aside class="sb-editor__notes-drawer" role="dialog" aria-modal="true" aria-labelledby="sb-editor-notes-title">
          <header>
            <h2 id="sb-editor-notes-title"></h2>
            <button type="button" class="sb-editor__icon-button" data-action="close-notes">${ICONS.close}</button>
          </header>
          <div class="sb-editor__notes-content"><textarea class="sb-editor__notes"></textarea></div>
          <footer><i aria-hidden="true"></i><span></span></footer>
        </aside>
      </div>
      <dialog class="sb-editor__help" aria-labelledby="sb-editor-help-title">
        <div class="sb-editor__help-card">
          <header><div><span class="sb-editor__help-eyebrow" data-help="eyebrow"></span><h2 id="sb-editor-help-title" data-help="title"></h2></div><button type="button" class="sb-editor__icon-button" data-action="close-help">${ICONS.close}</button></header>
          <p class="sb-editor__help-intro" data-help="intro"></p>
          <div class="sb-editor__help-grid">
            <section><h3 data-help="basics-title"></h3><ul><li data-help="select"></li><li data-help="add"></li><li data-help="move"></li><li data-help="zoom"></li></ul></section>
            <section><h3 data-help="shortcuts-title"></h3><dl>
              <div><dt><kbd>⌘ / Ctrl</kbd><b>+</b><kbd>C</kbd></dt><dd data-help="copy"></dd></div>
              <div><dt><kbd>⌘ / Ctrl</kbd><b>+</b><kbd>V</kbd></dt><dd data-help="paste"></dd></div>
              <div><dt><kbd>⌘ / Ctrl</kbd><b>+</b><kbd>X</kbd></dt><dd data-help="cut"></dd></div>
              <div><dt><kbd>⌫</kbd></dt><dd data-help="delete"></dd></div>
              <div><dt><kbd>⌘ / Ctrl</kbd><b>+</b><kbd>Z</kbd></dt><dd data-help="undo"></dd></div>
              <div><dt><kbd>⌘ / Ctrl</kbd><b>+</b><kbd>⇧</kbd><b>+</b><kbd>Z</kbd></dt><dd data-help="redo"></dd></div>
              <div><dt><kbd>Esc</kbd></dt><dd data-help="deselect"></dd></div>
              <div><dt><kbd>?</kbd></dt><dd data-help="shortcut-help"></dd></div>
            </dl></section>
          </div>
        </div>
      </dialog>`;

    this.boardHost = this.query<HTMLDivElement>('.sb-editor__board');
    this.applyMessages();
    if (this.options.showSave === false) this.query<HTMLButtonElement>('[data-action="save"]').hidden = true;
    this.renderSurfaceButtons(data?.surface.type ?? this.options.surface ?? this.sport.surfaces[0].id);
    this.renderToolbox();
    this.mountBoard(data);
    this.populateNotes();
    this.bindEditorControls();
    this.updateSelection();
  }

  private mountBoard(data: BoardDocument | undefined): void {
    const surface = data?.surface.type ?? this.options.surface ?? this.sport.surfaces[0].id;
    defineSportsBoardViewerElement();
    this.canvasElement = document.createElement('sports-board-viewer') as SportsBoardViewerElement;
    this.canvasElement.setAttribute('aria-label', this.messages.boardLabel);
    this.boardHost.replaceChildren(this.canvasElement);
    this.canvas = this.canvasElement.mountCanvas({
      mode: 'editor',
      surface,
      data,
      snap: { grid: .025 },
      controls: true,
      locale: this.options.locale,
      messages: this.messages,
      registry: this.sport.createRegistry()
    });
    this.canvasElement.addEventListener('viewportchange', event => {
      this.dispatchEvent(new CustomEvent('viewportchange', { detail: (event as CustomEvent).detail }));
    });
    this.board = this.canvas.getBoard();
    this.board.addEventListener('change', () => {
      this.renderColorPicker();
      this.dispatchEvent(new CustomEvent('change', { detail: { document: this.board.getDocument() } }));
    });
    this.board.addEventListener('selectionchange', event => this.handleSelection((event as CustomEvent<{ selectedIds: string[] }>).detail.selectedIds[0] ?? null));
  }

  private renderSurfaceButtons(activeSurface: string): void {
    const container = this.query<HTMLDivElement>('.sb-editor__surfaces');
    container.replaceChildren();
    for (const surface of this.sport.surfaces) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `sb-editor__surface${surface.id === activeSurface ? ' is-active' : ''}`;
      button.textContent = surface.label;
      button.addEventListener('click', () => {
        try {
          this.board.setSurface(surface.id);
          this.renderSurfaceButtons(surface.id);
          this.setStatus(this.message('surfaceActivated', { label: surface.label }), 'success');
        } catch (error) { this.setStatus((error as Error).message, 'error'); }
      });
      container.append(button);
    }
  }

  private renderToolbox(): void {
    const toolbox = this.query<HTMLElement>('.sb-editor__toolbox');
    toolbox.replaceChildren();
    for (const group of this.sport.groups) {
      const section = document.createElement('section');
      section.className = 'sb-editor__group';
      section.dataset.group = group.id;
      const title = document.createElement('h2');
      title.className = 'sb-editor__group-title';
      title.textContent = group.label;
      const tools = document.createElement('div');
      tools.className = group.layout === 'list' ? 'sb-editor__tool-list' : 'sb-editor__tool-grid';
      for (const tool of this.sport.elements.filter(item => item.group === group.id)) tools.append(this.createToolButton(tool));
      for (const tool of this.sport.connectors.filter(item => item.group === group.id)) tools.append(this.createToolButton(tool));
      section.append(title, tools);
      toolbox.append(section);
    }
  }

  private createToolButton(tool: EditorElementTool | EditorConnectorTool): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sb-editor__tool';
    button.dataset.tool = tool.id;
    button.dataset.group = tool.group;
    if (!('target' in tool) && tool.type) button.dataset.elementType = tool.type;
    button.title = tool.description ?? tool.label;
    const icon = document.createElement('span');
    icon.className = 'sb-editor__tool-icon';
    icon.textContent = tool.icon;
    const label = document.createElement('span');
    label.className = 'sb-editor__tool-label';
    label.textContent = tool.label;
    button.append(icon, label);
    if (!('target' in tool)) {
      button.draggable = true;
      button.addEventListener('dragstart', event => {
        this.draggedElement = tool;
        button.classList.add('is-dragging');
        event.dataTransfer?.setData('application/x-sportsboard-element', tool.id);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
        this.setStatus(this.message('dropElement', { label: tool.label.toLowerCase() }));
      });
      button.addEventListener('dragend', () => {
        this.draggedElement = null;
        button.classList.remove('is-dragging');
        this.query<HTMLDivElement>('.sb-editor__board-frame').classList.remove('is-drop-target');
      });
    }
    button.addEventListener('click', () => {
      try {
        if ('target' in tool) this.addConnector(tool);
        else this.addElement(tool, { x: .5, y: .5 });
        this.showMobilePanel('board');
        this.focusBoard();
      } catch (error) { this.setStatus((error as Error).message, 'error'); }
    });
    return button;
  }

  private bindEditorControls(): void {
    this.boardHost.addEventListener('pointerdown', () => this.focusBoard(), { capture: true });
    this.boardHost.addEventListener('dragover', event => {
      if (!this.draggedElement) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
      this.query<HTMLDivElement>('.sb-editor__board-frame').classList.add('is-drop-target');
    });
    this.boardHost.addEventListener('dragleave', () => this.query<HTMLDivElement>('.sb-editor__board-frame').classList.remove('is-drop-target'));
    this.boardHost.addEventListener('drop', event => this.handleElementDrop(event));
    this.query<HTMLButtonElement>('[data-action="undo"]').addEventListener('click', () => this.history('undo'));
    this.query<HTMLButtonElement>('[data-action="redo"]').addEventListener('click', () => this.history('redo'));
    this.query<HTMLButtonElement>('[data-action="delete"]').addEventListener('click', () => this.deleteSelection());
    this.query<HTMLButtonElement>('[data-action="clear"]').addEventListener('click', () => this.clearBoard());
    this.query<HTMLButtonElement>('[data-action="save"]').addEventListener('click', () => this.save());
    this.query<HTMLButtonElement>('[data-action="notes"]').addEventListener('click', () => this.openNotes());
    this.root.querySelectorAll<HTMLElement>('[data-action="close-notes"]').forEach(element => element.addEventListener('click', () => this.closeNotes()));
    this.query<HTMLButtonElement>('[data-action="help"]').addEventListener('click', () => this.openHelp());
    this.query<HTMLButtonElement>('[data-action="close-help"]').addEventListener('click', () => this.closeHelp());
    this.query<HTMLButtonElement>('[data-action="add-waypoint"]').addEventListener('click', () => this.addWaypoint());
    this.query<HTMLDialogElement>('.sb-editor__help').addEventListener('click', event => {
      if (event.target === event.currentTarget) this.closeHelp();
    });
    this.query<HTMLElement>('.sb-editor__mobile-nav').addEventListener('click', event => {
      const button = (event.target as Element).closest<HTMLButtonElement>('[data-panel]');
      if (button) this.showMobilePanel(button.dataset.panel as MobilePanel);
    });
    this.root.addEventListener('keydown', event => this.handleShortcut(event), { capture: true });
    this.query<HTMLElement>('[data-field="number"]').querySelector('input')!.addEventListener('input', event => this.updateNumber(event));
    const notes = this.query<HTMLTextAreaElement>('.sb-editor__notes');
    notes.addEventListener('input', () => this.flushNotes());
    notes.addEventListener('blur', () => { this.notesHistoryOpen = false; });
  }

  private handleElementDrop(event: DragEvent): void {
    if (!this.draggedElement) return;
    event.preventDefault();
    const tool = this.draggedElement;
    this.draggedElement = null;
    this.query<HTMLDivElement>('.sb-editor__board-frame').classList.remove('is-drop-target');
    try { this.addElement(tool, this.normalizedPoint(event.clientX, event.clientY)); }
    catch (error) { this.setStatus((error as Error).message, 'error'); }
  }

  private addElement(tool: EditorElementTool, point: Point): void {
    const added = this.board.add(tool.create(point, this.board));
    this.board.select(added.id);
    this.setStatus(this.message('elementAdded', { label: tool.label }), 'success');
  }

  private addConnector(tool: EditorConnectorTool): void {
    const center = { x: .5, y: .5 };
    const length = Math.max(.05, Math.min(.6, tool.defaultLength ?? .24));
    const preferred = tool.defaultDirection ?? { x: 0, y: -1 };
    const preferredLength = Math.hypot(preferred.x, preferred.y) || 1;
    const fallbackDirection = { x: preferred.x / preferredLength, y: preferred.y / preferredLength };
    const selected = this.selectedId ? this.board.getDocument().elements.find(element => element.id === this.selectedId) : undefined;
    const selectedDefinition = selected ? this.board.registry.getElement(selected.type) : undefined;
    const source = tool.target !== 'point' && selected
      && selected.x !== undefined
      && selected.y !== undefined
      && selectedDefinition?.layer !== 'connectors'
      && selectedDefinition?.connectable !== false
      ? selected
      : undefined;
    if (tool.target === 'element' && !source) throw new Error(`Select a connectable element before adding ${tool.label.toLowerCase()}`);

    let from: Endpoint;
    let to: Endpoint;
    if (source) {
      from = { element: source.id };
      const dx = center.x - source.x!;
      const dy = center.y - source.y!;
      const distance = Math.hypot(dx, dy);
      const direction = distance > .08 ? { x: dx / distance, y: dy / distance } : fallbackDirection;
      to = {
        x: Math.max(0, Math.min(1, source.x! + direction.x * length)),
        y: Math.max(0, Math.min(1, source.y! + direction.y * length))
      };
    } else {
      from = { x: center.x - fallbackDirection.x * length / 2, y: center.y - fallbackDirection.y * length / 2 };
      to = { x: center.x + fallbackDirection.x * length / 2, y: center.y + fallbackDirection.y * length / 2 };
    }

    const added = this.board.add(tool.create(from, to));
    this.board.select(added.id);
    this.setStatus(this.message(source ? 'connectorAddedFromSelection' : 'connectorAddedAtCenter', { label: tool.label }), 'success');
  }

  private normalizedPoint(clientX: number, clientY: number): Point {
    return this.board.clientToBoardPoint(clientX, clientY);
  }

  private handleSelection(targetId: string | null): void {
    this.selectedId = targetId;
    this.updateSelection();
  }

  private updateSelection(): void {
    const fields = this.query<HTMLFieldSetElement>('.sb-editor__fields');
    const element = this.selectedId ? this.board.getDocument().elements.find(item => item.id === this.selectedId) : undefined;
    if (!element) {
      this.selectedId = null;
      this.root.dataset.hasSelection = 'false';
      fields.disabled = true;
      this.query<HTMLElement>('[data-section="route"]').hidden = true;
      this.renderColorPicker();
      return;
    }
    this.root.dataset.hasSelection = 'true';
    fields.disabled = false;
    this.query<HTMLElement>('[data-section="route"]').hidden = this.board.registry.getElement(element.type).layer !== 'connectors';
    const numberField = this.query<HTMLElement>('[data-field="number"]');
    numberField.hidden = element.data?.number === undefined;
    numberField.querySelector('input')!.value = element.data?.number === undefined ? '' : String(element.data.number);
    const elementColor = String(element.style?.color ?? this.defaultColor(element));
    this.selectedColor = isColor(elementColor) ? elementColor : this.defaultColor(element);
    this.renderColorPicker();
  }

  private addWaypoint(): void {
    if (!this.selectedId) return;
    try {
      const element = this.board.addWaypoint(this.selectedId);
      this.setStatus(this.message('waypointsAdded', { count: element.waypoints?.length ?? 0 }), 'success');
      this.updateSelection();
    } catch (error) { this.setStatus((error as Error).message, 'error'); }
  }

  private defaultColor(element: BoardElement): string {
    const registeredColor = this.board.registry.getElement(element.type).defaults?.style?.color;
    if (typeof registeredColor === 'string' && isColor(registeredColor)) return registeredColor;
    if (element.type.endsWith('.defender')) return '#dc2626';
    if (element.type.endsWith('.coach')) return '#0f172a';
    if (element.type.endsWith('.cone') || element.type.endsWith('.ball')) return '#f97316';
    if (element.type.endsWith('.ladder')) return '#facc15';
    return '#2563eb';
  }

  private updateNumber(event: Event): void {
    if (!this.selectedId) return;
    const input = event.currentTarget as HTMLInputElement;
    if (input.value === '' || !input.validity.valid) return;
    const element = this.board.getDocument().elements.find(item => item.id === this.selectedId);
    if (!element || element.data?.number === undefined) return;
    try {
      this.board.update(this.selectedId, { data: { ...element.data, number: Number(input.value) } });
      this.updateSelection();
      this.setStatus(this.messages.numberUpdated, 'success');
    } catch (error) { this.setStatus((error as Error).message, 'error'); }
  }

  private deleteSelection(): void {
    if (!this.selectedId) return this.setStatus(this.messages.selectionRequired, 'error');
    try {
      this.board.remove(this.selectedId);
      this.selectedId = null;
      this.updateSelection();
      this.setStatus(this.messages.elementDeleted, 'success');
    } catch (error) { this.setStatus((error as Error).message, 'error'); }
  }

  private copySelection(announce = true): boolean {
    if (!this.selectedId) {
      if (announce) this.setStatus(this.messages.selectionRequired, 'error');
      return false;
    }
    const document = this.board.getDocument();
    const element = document.elements.find(item => item.id === this.selectedId);
    if (!element) return false;
    this.clipboard = { element: clone(element), document };
    this.pasteCount = 0;
    if (announce) this.setStatus(this.messages.copied, 'success');
    return true;
  }

  private cutSelection(): void {
    if (!this.copySelection(false) || !this.selectedId) return this.setStatus(this.messages.selectionRequired, 'error');
    this.board.remove(this.selectedId);
    this.selectedId = null;
    this.updateSelection();
    this.setStatus(this.messages.cut, 'success');
  }

  private pasteSelection(): void {
    if (!this.clipboard) return this.setStatus(this.messages.clipboardEmpty, 'error');
    try {
      this.pasteCount += 1;
      const added = this.board.add(createClipboardElement(this.clipboard.element, this.clipboard.document, .025 * this.pasteCount));
      this.board.select(added.id);
      this.showMobilePanel('board');
      this.focusBoard();
      this.setStatus(this.messages.pasted, 'success');
    } catch (error) { this.setStatus((error as Error).message, 'error'); }
  }

  private handleShortcut(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const editingText = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
    const command = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();

    if (!editingText && event.key === '?') {
      event.preventDefault();
      event.stopPropagation();
      this.openHelp();
      return;
    }
    if (event.key === 'Escape') {
      const dialog = this.query<HTMLDialogElement>('.sb-editor__help');
      if (!this.query<HTMLElement>('.sb-editor__notes-overlay').hidden) this.closeNotes();
      else if (dialog.open) this.closeHelp();
      else if (!editingText) this.board.clearSelection();
      return;
    }
    if (editingText) return;

    if (command && ['c', 'v', 'x', 'z', 'y'].includes(key)) {
      event.preventDefault();
      event.stopPropagation();
      if (key === 'c') this.copySelection();
      if (key === 'v') this.pasteSelection();
      if (key === 'x') this.cutSelection();
      if (key === 'z') this.history(event.shiftKey ? 'redo' : 'undo');
      if (key === 'y') this.history('redo');
      return;
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && this.selectedId) {
      event.preventDefault();
      event.stopPropagation();
      this.deleteSelection();
    }
  }

  private focusBoard(): void {
    this.boardHost.focus({ preventScroll: true });
  }

  private showMobilePanel(panel: MobilePanel): void {
    this.root.dataset.mobilePanel = panel;
    this.root.querySelectorAll<HTMLButtonElement>('.sb-editor__mobile-nav [data-panel]').forEach(button => {
      const active = button.dataset.panel === panel;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (panel === 'board') requestAnimationFrame(() => this.focusBoard());
  }

  private openHelp(): void {
    const dialog = this.query<HTMLDialogElement>('.sb-editor__help');
    if (!dialog.open) dialog.showModal();
  }

  private closeHelp(): void {
    const dialog = this.query<HTMLDialogElement>('.sb-editor__help');
    if (dialog.open) dialog.close();
    this.query<HTMLButtonElement>('[data-action="help"]').focus({ preventScroll: true });
  }

  private openNotes(): void {
    const overlay = this.query<HTMLElement>('.sb-editor__notes-overlay');
    overlay.hidden = false;
    this.root.dataset.notesOpen = 'true';
    this.query<HTMLButtonElement>('[data-action="notes"]').setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => this.query<HTMLTextAreaElement>('.sb-editor__notes').focus({ preventScroll: true }));
  }

  private closeNotes(): void {
    const overlay = this.query<HTMLElement>('.sb-editor__notes-overlay');
    if (overlay.hidden) return;
    this.flushNotes();
    this.notesHistoryOpen = false;
    overlay.hidden = true;
    delete this.root.dataset.notesOpen;
    const button = this.query<HTMLButtonElement>('[data-action="notes"]');
    button.setAttribute('aria-expanded', 'false');
    button.focus({ preventScroll: true });
  }

  private history(direction: 'undo' | 'redo'): void {
    try {
      const changed = direction === 'undo' ? this.board.undo() : this.board.redo();
      this.selectedId = null;
      this.updateSelection();
      this.renderSurfaceButtons(this.board.getDocument().surface.type);
      this.populateNotes();
      this.notesHistoryOpen = false;
      this.setStatus(changed ? (direction === 'undo' ? this.messages.actionUndone : this.messages.actionRedone) : this.messages.noActionAvailable, changed ? 'success' : 'info');
    } catch (error) { this.setStatus((error as Error).message, 'error'); }
  }

  private clearBoard(): void {
    try {
      const changed = this.board.clear();
      this.selectedId = null;
      this.updateSelection();
      this.setStatus(changed ? this.messages.boardCleared : this.messages.boardAlreadyEmpty, changed ? 'success' : 'info');
    } catch (error) { this.setStatus((error as Error).message, 'error'); }
  }

  private syncMeta(recordHistory: boolean): boolean {
    const current = this.board.getDocument();
    const { title: _discardedTitle, ...existingMeta } = current.meta ?? {};
    const meta = { ...existingMeta, notes: this.query<HTMLTextAreaElement>('.sb-editor__notes').value };
    if (JSON.stringify(current.meta ?? {}) === JSON.stringify(meta)) return false;
    this.board.setMeta(meta, { recordHistory });
    return true;
  }

  private flushNotes(): void {
    if (!this.board || !this.root?.querySelector('.sb-editor__notes')) return;
    const changed = this.syncMeta(!this.notesHistoryOpen);
    if (changed) this.notesHistoryOpen = true;
    this.updateNotesIndicator();
  }

  private populateNotes(): void {
    const meta = this.board.getDocument().meta;
    this.query<HTMLTextAreaElement>('.sb-editor__notes').value = meta?.notes ?? '';
    this.updateNotesIndicator();
  }

  private updateNotesIndicator(): void {
    const hasNotes = this.query<HTMLTextAreaElement>('.sb-editor__notes').value.trim().length > 0;
    this.query<HTMLButtonElement>('[data-action="notes"]').dataset.hasNotes = String(hasNotes);
  }

  private save(): void {
    this.flushNotes();
    const document = this.board.getDocument();
    const detail: EditorSaveDetail = { document, json: this.board.toJSON(true) };
    this.options.onSave?.(document);
    this.dispatchEvent(new CustomEvent<EditorSaveDetail>('save', { detail }));
    this.setStatus(this.messages.boardReadyToSave, 'success');
  }

  private renderColorPicker(): void {
    const picker = this.query<HTMLDivElement>('.sb-editor__color-picker');
    picker.replaceChildren();
    const palette = (this.options.colorPalette ?? [...DEFAULT_COLORS]).map(color => ({ ...color }));
    const documentColors = uniqueColors(this.board.getDocument().elements.map(element => String(element.style?.color ?? this.defaultColor(element))).filter(isColor).map(value => ({ value, label: value })));
    const sections: Array<{ label: string; colors: Array<{ value: string; label: string }> }> = [
      { label: this.messages.palette, colors: palette },
      { label: this.messages.documentColors, colors: documentColors }
    ];
    for (const section of sections) {
      if (!section.colors.length) continue;
      const wrapper = document.createElement('div');
      wrapper.className = 'sb-editor__color-section';
      const label = document.createElement('small');
      label.textContent = section.label;
      const colors = document.createElement('div');
      colors.className = 'sb-editor__color-list';
      for (const color of section.colors) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `sb-editor__color${color.value.toLowerCase() === this.selectedColor.toLowerCase() ? ' is-active' : ''}`;
        button.style.setProperty('--sb-color', color.value);
        button.title = `${color.label} · ${color.value}`;
        button.setAttribute('aria-label', this.message('colorOption', { label: color.label }));
        button.addEventListener('click', () => this.applyColor(color.value));
        colors.append(button);
      }
      wrapper.append(label, colors);
      picker.append(wrapper);
    }
  }

  private applyColor(color: string): void {
    if (!this.selectedId || !isColor(color)) return;
    const element = this.board.getDocument().elements.find(item => item.id === this.selectedId);
    if (!element) return;
    try {
      this.selectedColor = color;
      this.board.update(this.selectedId, { style: { ...element.style, color } });
      this.setStatus(this.messages.colorUpdated, 'success');
    } catch (error) { this.setStatus((error as Error).message, 'error'); }
  }

  private setStatus(message: string, tone: 'info' | 'success' | 'error' = 'info'): void {
    const toast = this.root?.querySelector<HTMLDivElement>('.sb-editor__toast');
    if (toast) {
      if (this.toastTimer) clearTimeout(this.toastTimer);
      toast.textContent = message;
      toast.dataset.tone = tone;
      toast.hidden = false;
      this.toastTimer = setTimeout(() => { toast.hidden = true; }, 2600);
    }
    this.dispatchEvent(new CustomEvent('status', { detail: { message, tone } }));
  }

  private applyMessages(): void {
    this.query<HTMLDivElement>('.sb-editor__surfaces').ariaLabel = this.messages.surfaceLabel;
    this.query<HTMLElement>('.sb-editor__toolbox').ariaLabel = this.messages.toolboxLabel;
    this.query<HTMLElement>('.sb-editor__inspector').ariaLabel = this.messages.inspectorLabel;
    this.query<HTMLElement>('.sb-editor__mobile-nav').ariaLabel = this.messages.mobileNavigation;
    this.query<HTMLElement>('[data-label="properties"]').textContent = this.messages.properties;
    this.query<HTMLElement>('[data-label="route"]').textContent = this.messages.route;
    this.query<HTMLElement>('[data-field="number"] span').textContent = this.messages.number;
    this.query<HTMLElement>('[data-field="color"] > span').textContent = this.messages.color;
    this.query<HTMLButtonElement>('[data-action="add-waypoint"]').textContent = `＋ ${this.messages.addWaypoint}`;
    this.query<HTMLElement>('.sb-editor__hint').textContent = this.messages.routeHint;
    this.query<HTMLTextAreaElement>('.sb-editor__notes').placeholder = this.messages.notesPlaceholder;
    this.query<HTMLTextAreaElement>('.sb-editor__notes').ariaLabel = this.messages.notes;
    this.query<HTMLElement>('.sb-editor__notes-drawer h2').textContent = this.messages.notes;
    this.query<HTMLElement>('.sb-editor__notes-drawer footer span').textContent = this.messages.notesAutosave;
    const notesButton = this.query<HTMLButtonElement>('[data-action="notes"]');
    notesButton.querySelector('span')!.textContent = this.messages.notes;
    notesButton.title = notesButton.ariaLabel = this.messages.notes;
    notesButton.setAttribute('aria-expanded', 'false');
    const closeNotes = this.query<HTMLButtonElement>('.sb-editor__notes-drawer [data-action="close-notes"]');
    closeNotes.title = closeNotes.ariaLabel = this.messages.close;
    this.query<HTMLSpanElement>('.sb-editor__save span').textContent = this.messages.save;
    this.query<HTMLButtonElement>('[data-action="save"]').ariaLabel = this.messages.save;
    const helpButton = this.query<HTMLButtonElement>('[data-action="help"]');
    helpButton.title = helpButton.ariaLabel = this.messages.help;
    const closeHelp = this.query<HTMLButtonElement>('[data-action="close-help"]');
    closeHelp.title = closeHelp.ariaLabel = this.messages.close;
    for (const [panel, label] of [
      ['tools', this.messages.toolboxLabel],
      ['board', this.messages.boardPanel],
      ['inspector', this.messages.inspectorLabel]
    ] as const) {
      const button = this.query<HTMLButtonElement>(`.sb-editor__mobile-nav [data-panel="${panel}"]`);
      button.querySelector('span')!.textContent = label;
      button.ariaLabel = label;
      button.setAttribute('aria-pressed', String(panel === 'board'));
    }
    for (const [name, value] of [
      ['eyebrow', this.messages.help],
      ['title', this.messages.helpTitle],
      ['intro', this.messages.helpIntro],
      ['basics-title', this.messages.helpBasicsTitle],
      ['select', this.messages.helpBasicsSelect],
      ['add', this.messages.helpBasicsAdd],
      ['move', this.messages.helpBasicsMove],
      ['zoom', this.messages.helpBasicsZoom],
      ['shortcuts-title', this.messages.helpShortcutsTitle],
      ['copy', this.messages.shortcutCopy],
      ['paste', this.messages.shortcutPaste],
      ['cut', this.messages.shortcutCut],
      ['delete', this.messages.shortcutDelete],
      ['undo', this.messages.shortcutUndo],
      ['redo', this.messages.shortcutRedo],
      ['deselect', this.messages.shortcutDeselect],
      ['shortcut-help', this.messages.shortcutHelp]
    ] as const) this.query<HTMLElement>(`[data-help="${name}"]`).textContent = value;
    for (const [action, message] of [
      ['undo', this.messages.undo],
      ['redo', this.messages.redo],
      ['delete', this.messages.deleteSelection],
      ['clear', this.messages.clearBoard]
    ] as const) {
      const button = this.query<HTMLButtonElement>(`[data-action="${action}"]`);
      button.title = button.ariaLabel = message;
    }
  }

  private message(key: keyof EditorMessages, values: Record<string, string | number>): string {
    return values
      ? Object.entries(values).reduce((message, [name, value]) => message.replaceAll(`{${name}}`, String(value)), this.messages[key])
      : this.messages[key];
  }

  private query<T extends Element>(selector: string): T {
    const value = this.root.querySelector<T>(selector);
    if (!value) throw new Error(`SportsBoardEditor internal element not found: ${selector}`);
    return value;
  }
}
