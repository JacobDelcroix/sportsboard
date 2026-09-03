import Konva from 'konva';
import { History } from './history.js';
import { constrainTransformerBox, requestsWheelZoom } from './interactions.js';
import { Registry } from './registry.js';
import { isElementEndpoint, registerBuiltins } from './builtins.js';
import { detachElementReferences } from './references.js';
import { MODE_PRESETS } from './types.js';
import { validateBoardDocument } from './validation.js';
import type { BoardChangeDetail, BoardDocument, BoardElement, BoardElementActivateDetail, BoardImageOptions, BoardMode, BoardModeDetail, BoardMutationOptions, BoardOptions, BoardPermissions, BoardUIState, BoardViewportDetail, ElementInput, Endpoint, PermissionOverrides, Point } from './types.js';

const clone = <T>(value: T): T => structuredClone(value);
const id = (): string => globalThis.crypto?.randomUUID?.() ?? `sb-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const emptyDocument = (surface: string): BoardDocument => ({ schema: 'sportsboard', version: 1, surface: { type: surface }, elements: [] });
const clampPoint = (point: Point): Point => ({ x: Math.max(0, Math.min(1, point.x)), y: Math.max(0, Math.min(1, point.y)) });
const MIN_ZOOM = 1;
const MAX_ZOOM = 2;
const usesCoarsePointer = (): boolean => globalThis.matchMedia?.('(pointer: coarse)').matches ?? false;
const segmentDistance = (point: Point, from: Point, to: Point): number => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSquared = dx * dx + dy * dy;
  const progress = lengthSquared ? Math.max(0, Math.min(1, ((point.x - from.x) * dx + (point.y - from.y) * dy) / lengthSquared)) : 0;
  return Math.hypot(point.x - (from.x + dx * progress), point.y - (from.y + dy * progress));
};

export class SportsBoard extends EventTarget {
  readonly container: HTMLElement;
  readonly registry: Registry;
  private stage: Konva.Stage;
  private backgroundLayer = new Konva.Layer();
  private annotationLayer = new Konva.Layer();
  private connectorLayer = new Konva.Layer();
  private contentLayer = new Konva.Layer();
  private uiLayer = new Konva.Layer();
  private connectorHandles = new Konva.Group();
  private transformer = new Konva.Transformer({
    borderStroke: '#2563eb',
    anchorStroke: '#2563eb',
    enabledAnchors: [],
    resizeEnabled: false
  });
  private history = new History();
  private magnetCandidateById = new Map<string, { element: string; anchor: Point }>();
  private document: BoardDocument;
  private ui: BoardUIState = { selectedIds: [], zoom: 1, pan: { x: 0, y: 0 } };
  private elementById = new Map<string, BoardElement>();
  private nodeById = new Map<string, Konva.Node>();
  private connectionRectById = new Map<string, { x: number; y: number; width: number; height: number }>();
  private mode: BoardMode;
  private overrides: PermissionOverrides;
  private permissions: BoardPermissions;
  private options: BoardOptions;
  private interactive: boolean;
  private resizeObserver?: ResizeObserver;
  private resizeFrame?: number;
  private connectorRenderFrame?: number;
  private dirtyConnectorIds: Set<string> | null = new Set();
  private keydownHandler?: (event: KeyboardEvent) => void;
  private panning = false;
  private lastPanPointer?: Point;
  private pinch?: { distance: number; zoom: number; boardPoint: Point };

  constructor(target: string | HTMLElement, options: BoardOptions = {}, registry?: Registry) {
    super();
    const container = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    if (!container) throw new Error('SportsBoard target was not found');
    this.container = container;
    this.options = options;
    this.interactive = options.interactive ?? true;
    this.mode = options.mode ?? 'editor';
    this.overrides = options.permissions ?? {};
    this.permissions = this.resolvePermissions();
    this.registry = registry ?? registerBuiltins();
    if (usesCoarsePointer()) this.transformer.setAttrs({ anchorSize: 16, rotateAnchorOffset: 28 });
    const parsed: unknown = typeof options.data === 'string' ? JSON.parse(options.data) : options.data;
    const initial: unknown = parsed ?? emptyDocument(options.surface ?? 'basketball.halfcourt');
    validateBoardDocument(initial, this.registry);
    this.document = clone(initial);
    this.stage = new Konva.Stage({ container: container as HTMLDivElement, width: options.width ?? (container.clientWidth || 800), height: options.height ?? (container.clientHeight || 600) });
    if (this.interactive) this.stage.container().style.touchAction = 'none';
    this.stage.add(this.backgroundLayer, this.annotationLayer, this.connectorLayer, this.contentLayer, this.uiLayer);
    this.uiLayer.add(this.connectorHandles, this.transformer);
    if (!this.interactive) {
      this.backgroundLayer.listening(false);
      this.annotationLayer.listening(false);
      this.connectorLayer.listening(false);
      this.contentLayer.listening(false);
      this.uiLayer.listening(false);
    }
    if (this.interactive) this.bindEvents();
    if (!options.width || !options.height) {
      this.resizeObserver = new ResizeObserver(() => this.scheduleResize());
      this.resizeObserver.observe(container);
    }
    this.render();
  }

  getMode(): BoardMode { return this.mode; }
  getPermissions(): Readonly<BoardPermissions> { return { ...this.permissions }; }
  setMode(mode: BoardMode, permissions: PermissionOverrides = this.overrides): void {
    this.mode = mode; this.overrides = { ...permissions }; this.permissions = this.resolvePermissions();
    if (!this.permissions.select) this.clearSelection();
    this.render();
    this.dispatchEvent(new CustomEvent<BoardModeDetail>('modechange', { detail: { mode, permissions: this.getPermissions() as BoardPermissions } }));
  }
  setPermissions(overrides: PermissionOverrides): void { this.overrides = { ...overrides }; this.setMode(this.mode, this.overrides); }
  getDocument(): BoardDocument { return clone(this.document); }
  getUIState(): Readonly<BoardUIState> { return clone(this.ui); }
  setZoom(zoom: number, anchor: Point = { x: this.stage.width() / 2, y: this.stage.height() / 2 }): number {
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    const boardPoint = this.viewportToBoard(anchor);
    this.ui.zoom = nextZoom;
    this.ui.pan = { x: anchor.x - boardPoint.x * nextZoom, y: anchor.y - boardPoint.y * nextZoom };
    this.applyViewport();
    return this.ui.zoom;
  }
  zoomBy(factor: number, anchor?: Point): number { return this.setZoom(this.ui.zoom * factor, anchor); }
  panBy(x: number, y: number): Point {
    this.ui.pan = { x: this.ui.pan.x + x, y: this.ui.pan.y + y };
    this.applyViewport();
    return clone(this.ui.pan);
  }
  resetViewport(): void {
    this.ui.zoom = MIN_ZOOM;
    this.ui.pan = { x: 0, y: 0 };
    this.applyViewport();
  }
  clientToBoardPoint(clientX: number, clientY: number): Point {
    const rect = this.stage.container().getBoundingClientRect();
    const point = this.viewportToBoard({ x: clientX - rect.left, y: clientY - rect.top });
    return clampPoint({ x: point.x / this.stage.width(), y: point.y / this.stage.height() });
  }
  toJSON(pretty = false): string { return JSON.stringify(this.document, null, pretty ? 2 : undefined); }
  toCanvas(options: BoardImageOptions = {}): HTMLCanvasElement {
    const pixelRatio = options.width && options.width > 0 ? options.width / this.stage.width() : Math.max(.1, options.pixelRatio ?? 1);
    return this.withExportViewport(() => this.stage.toCanvas({ pixelRatio, imageSmoothingEnabled: true }));
  }
  toDataURL(options: BoardImageOptions = {}): string {
    const canvas = this.toCanvas(options);
    return canvas.toDataURL(options.type ?? 'image/png', options.quality);
  }
  toBlob(options: BoardImageOptions = {}): Promise<Blob> {
    const canvas = this.toCanvas(options);
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('SportsBoard image export failed')), options.type ?? 'image/png', options.quality));
  }
  load(input: BoardDocument | string): void {
    const parsed: unknown = typeof input === 'string' ? JSON.parse(input) : input;
    validateBoardDocument(parsed, this.registry);
    const previous = this.document;
    this.document = clone(parsed);
    try { this.resize(); }
    catch (error) { this.document = previous; this.resize(); throw error; }
    this.history.clear();
    this.clearSelection();
    this.emitChange('content');
  }
  setMeta(meta: BoardDocument['meta'], options: BoardMutationOptions = {}): void {
    this.require('editProperties');
    const next = clone(this.document);
    next.meta = meta ? clone(meta) : undefined;
    validateBoardDocument(next, this.registry);
    if (options.recordHistory !== false) this.commit();
    this.document = next;
    this.emitChange('meta');
  }
  setSurface(type: string, data?: Record<string, unknown>): void {
    this.require('editProperties');
    const next = clone(this.document);
    next.surface = data ? { type, data: clone(data) } : { type };
    validateBoardDocument(next, this.registry);
    this.commit();
    this.document = next;
    this.resize();
    this.emitChange('surface');
  }
  add(input: ElementInput): BoardElement {
    this.require('create');
    const definition = this.registry.getElement(input.type);
    const element = { ...clone(definition.defaults ?? {}), ...clone(input), id: input.id ?? id() } as BoardElement;
    const next = clone(this.document);
    next.elements.push(element);
    validateBoardDocument(next, this.registry);
    this.commit();
    this.document = next;
    this.render();
    this.emitChange();
    return clone(element);
  }
  update(elementId: string, patch: Partial<Omit<BoardElement, 'id' | 'type'>>, options: BoardMutationOptions = {}): BoardElement {
    this.require('editProperties');
    if ('x' in patch || 'y' in patch) this.require('move');
    if ('rotation' in patch) this.require('rotate');
    const index = this.indexOf(elementId);
    const next = clone(this.document);
    next.elements[index] = { ...next.elements[index], ...clone(patch) };
    validateBoardDocument(next, this.registry);
    if (options.recordHistory !== false) this.commit();
    this.document = next;
    this.render();
    this.emitChange();
    return clone(next.elements[index]);
  }
  addWaypoint(elementId: string, point?: Point): BoardElement {
    this.require('editProperties');
    const element = this.document.elements[this.indexOf(elementId)];
    if (this.registry.getElement(element.type).layer !== 'connectors') throw new Error(`Element '${elementId}' is not a connector`);
    const route = this.logicalConnectorRoute(element);
    let insertion = 0;
    let waypoint = point ? clampPoint(point) : undefined;
    if (waypoint) {
      let closest = Number.POSITIVE_INFINITY;
      for (let index = 0; index < route.length - 1; index += 1) {
        const distance = segmentDistance(waypoint, route[index], route[index + 1]);
        if (distance < closest) { closest = distance; insertion = index; }
      }
    } else {
      let longest = -1;
      for (let index = 0; index < route.length - 1; index += 1) {
        const length = Math.hypot(route[index + 1].x - route[index].x, route[index + 1].y - route[index].y);
        if (length > longest) { longest = length; insertion = index; }
      }
      waypoint = { x: (route[insertion].x + route[insertion + 1].x) / 2, y: (route[insertion].y + route[insertion + 1].y) / 2 };
    }
    this.commit();
    element.waypoints = [...(element.waypoints ?? [])];
    element.waypoints.splice(insertion, 0, waypoint);
    this.render(); this.select(elementId); this.emitChange();
    return clone(element);
  }
  removeWaypoint(elementId: string, waypointIndex: number): BoardElement {
    this.require('editProperties');
    const element = this.document.elements[this.indexOf(elementId)];
    if (!element.waypoints?.[waypointIndex]) throw new Error(`Unknown waypoint ${waypointIndex} for connector '${elementId}'`);
    this.commit();
    element.waypoints.splice(waypointIndex, 1);
    if (!element.waypoints.length) delete element.waypoints;
    this.render(); this.select(elementId); this.emitChange();
    return clone(element);
  }
  remove(elementId: string): void {
    this.require('delete');
    const index = this.indexOf(elementId);
    this.commit();
    detachElementReferences(this.document, elementId, (element, key) => this.connectorEndpointPosition(element, key));
    this.document.elements.splice(index, 1);
    if (this.ui.selectedIds.includes(elementId)) this.clearSelection();
    this.render();
    this.emitChange();
  }
  clear(): boolean {
    this.require('delete');
    if (!this.document.elements.length) { this.clearSelection(); return false; }
    this.commit();
    this.document.elements = [];
    this.clearSelection();
    this.render();
    this.emitChange();
    return true;
  }
  undo(): boolean { this.require('history'); const previous = this.history.undo(this.document); if (!previous) return false; this.document = previous; this.clearSelection(); this.resize(); this.emitChange(); return true; }
  redo(): boolean { this.require('history'); const next = this.history.redo(this.document); if (!next) return false; this.document = next; this.clearSelection(); this.resize(); this.emitChange(); return true; }
  select(elementId: string | null): void { if (!this.permissions.select || !elementId) return this.clearSelection(); this.indexOf(elementId); this.ui.selectedIds = [elementId]; this.syncTransformer(); this.dispatchEvent(new CustomEvent('selectionchange', { detail: { selectedIds: [...this.ui.selectedIds] } })); }
  clearSelection(): void {
    const changed = this.ui.selectedIds.length > 0;
    this.ui.selectedIds = [];
    this.transformer.nodes([]);
    this.connectorHandles.destroyChildren();
    this.uiLayer.batchDraw();
    if (changed) this.dispatchEvent(new CustomEvent('selectionchange', { detail: { selectedIds: [] } }));
  }
  destroy(): void {
    this.resizeObserver?.disconnect();
    if (this.resizeFrame !== undefined) cancelAnimationFrame(this.resizeFrame);
    if (this.connectorRenderFrame !== undefined) cancelAnimationFrame(this.connectorRenderFrame);
    if (this.keydownHandler) this.container.removeEventListener('keydown', this.keydownHandler);
    this.stage.destroy();
  }

  private resolvePermissions(): BoardPermissions { return { ...MODE_PRESETS[this.mode], ...this.overrides }; }
  private require(permission: keyof BoardPermissions): void { if (!this.permissions[permission]) throw new Error(`Action denied: permission '${permission}' is disabled in ${this.mode} mode`); }
  private indexOf(elementId: string): number { const index = this.document.elements.findIndex(item => item.id === elementId); if (index < 0) throw new Error(`Unknown element: ${elementId}`); return index; }
  private commit(): void { this.history.push(this.document); }
  private emitChange(kind: BoardChangeDetail['kind'] = 'content'): void {
    this.dispatchEvent(new CustomEvent<BoardChangeDetail>('change', { detail: { document: this.getDocument(), kind } }));
  }
  private bindEvents(): void {
    this.stage.on('wheel', event => {
      const nativeEvent = event.evt as WheelEvent;
      if (!requestsWheelZoom(nativeEvent)) return;
      nativeEvent.preventDefault();
      const pointer = this.stage.getPointerPosition();
      if (pointer) this.zoomBy(nativeEvent.deltaY < 0 ? 1.12 : 1 / 1.12, pointer);
    });
    this.stage.on('pointerdown', event => {
      const nativeEvent = event.evt as PointerEvent;
      if (nativeEvent.pointerType === 'touch') return;
      if (nativeEvent.button === 1 || this.mode === 'viewer' || (this.ui.zoom > MIN_ZOOM && event.target === this.stage)) {
        event.cancelBubble = true;
        nativeEvent.preventDefault();
        this.beginPan(this.stage.getPointerPosition());
        return;
      }
      if (event.target === this.stage && this.permissions.select) this.clearSelection();
    });
    this.stage.on('pointermove', event => {
      const nativeEvent = event.evt as PointerEvent;
      if (nativeEvent.pointerType !== 'touch') this.movePan(this.stage.getPointerPosition());
    });
    this.stage.on('pointerup pointercancel pointerleave', () => this.endPan());
    this.stage.on('touchstart', event => this.handleTouchStart(event.evt as TouchEvent, event.target));
    this.stage.on('touchmove', event => this.handleTouchMove(event.evt as TouchEvent));
    this.stage.on('touchend touchcancel', event => this.handleTouchEnd(event.evt as TouchEvent));
    this.container.tabIndex ||= 0;
    this.keydownHandler = event => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && this.permissions.delete && this.ui.selectedIds.length) { event.preventDefault(); this.remove(this.ui.selectedIds[0]); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && this.permissions.history) { event.preventDefault(); event.shiftKey ? this.redo() : this.undo(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y' && this.permissions.history) { event.preventDefault(); this.redo(); }
    };
    this.container.addEventListener('keydown', this.keydownHandler);
  }
  private scheduleResize(): void {
    if (this.resizeFrame !== undefined) return;
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = undefined;
      this.resize();
    });
  }

  private resize(): void {
    const width = this.options.width ?? this.container.clientWidth;
    const surface = this.registry.getSurface(this.document.surface.type);
    const height = this.options.height ?? width / surface.ratio;
    if (width <= 0 || height <= 0 || (width === this.stage.width() && height === this.stage.height())) return;
    this.stage.size({ width, height });
    this.clampPan();
    this.render();
  }
  private render(): void {
    if (this.connectorRenderFrame !== undefined) { cancelAnimationFrame(this.connectorRenderFrame); this.connectorRenderFrame = undefined; }
    this.dirtyConnectorIds = new Set();
    const width = this.stage.width(), height = this.stage.height();
    this.backgroundLayer.destroyChildren(); this.annotationLayer.destroyChildren(); this.connectorLayer.destroyChildren(); this.contentLayer.destroyChildren(); this.nodeById.clear(); this.connectionRectById.clear();
    this.elementById = new Map(this.document.elements.map(element => [element.id, element]));
    const surface = this.registry.getSurface(this.document.surface.type);
    const renderedSurface = surface.render(width, height, this.document.surface.data);
    renderedSurface.listening(false);
    this.backgroundLayer.add(renderedSurface);
    const context = this.renderContext();
    for (const element of this.document.elements) {
      const definition = this.registry.getElement(element.type);
      if (definition.layer === 'connectors') continue;
      const renderedNode = definition.render(element, context);
      const node: Konva.Node = renderedNode;
      node.setAttrs({ id: element.id, name: 'sportsboard-element', draggable: this.interactive && this.permissions.move && element.x !== undefined && element.y !== undefined });
      if (this.interactive) {
        node.on('pointerdown', event => { if (this.mode === 'viewer') return; event.cancelBubble = true; if (this.permissions.select) this.select(element.id); });
        node.on('dblclick dbltap', event => { event.cancelBubble = true; this.activateElement(element.id); });
        let beforeDrag: BoardDocument | undefined;
        node.on('dragstart', () => { beforeDrag = clone(this.document); this.magnetCandidateById.delete(element.id); });
        node.on('dragmove', () => { this.applySnap(node); this.applyMagnet(node, element); this.scheduleConnectorRender(element.id); });
        node.on('dragend', () => {
          if (!this.permissions.move) return;
          if (beforeDrag) this.history.push(beforeDrag);
          const current = this.document.elements[this.indexOf(element.id)];
          const absolute = this.viewportToBoard(node.absolutePosition());
          current.x = absolute.x / width;
          current.y = absolute.y / height;
          if (definition.magnet) {
            const candidate = this.magnetCandidateById.get(element.id);
            if (candidate) current.attachment = clone(candidate);
            else delete current.attachment;
            this.magnetCandidateById.delete(element.id);
          }
          this.render(); this.select(element.id); this.emitChange();
        });
        node.on('transformstart', () => { beforeDrag = clone(this.document); });
        node.on('transform', () => { this.keepLabelsUpright(node); this.scheduleConnectorRender(element.id); });
        node.on('transformend', () => {
          const resize = definition.resize;
          if (!this.permissions.rotate && (!resize || !this.permissions.editProperties)) return;
          if (beforeDrag) this.history.push(beforeDrag);
          const current = this.document.elements[this.indexOf(element.id)];
          if (this.permissions.rotate) current.rotation = node.rotation();
          if (resize && this.permissions.editProperties) {
            const defaultWidth = typeof definition.defaults?.width === 'number' ? definition.defaults.width : .1;
            const defaultHeight = typeof definition.defaults?.height === 'number' ? definition.defaults.height : .1;
            const baseWidth = current.width ?? defaultWidth;
            const baseHeight = current.height ?? defaultHeight;
            current.width = Math.max(resize.minWidth, Math.min(resize.maxWidth, baseWidth * Math.abs(node.scaleX())));
            current.height = Math.max(resize.minHeight, Math.min(resize.maxHeight, baseHeight * Math.abs(node.scaleY())));
            const absolute = this.viewportToBoard(node.absolutePosition());
            const position = clampPoint({ x: absolute.x / width, y: absolute.y / height });
            current.x = position.x;
            current.y = position.y;
          }
          this.render(); this.select(element.id); this.emitChange();
        });
      }
      this.nodeById.set(element.id, node);
      const targetLayer = definition.layer === 'background'
        ? this.backgroundLayer
        : definition.layer === 'annotations' ? this.annotationLayer : this.contentLayer;
      targetLayer.add(renderedNode);
      // Capture the element's own geometry before attached elements become
      // children of its Konva group.
      this.connectionRectById.set(element.id, node.getClientRect({ skipTransform: true, skipShadow: true, skipStroke: true }));
      if (definition.transformable === false) renderedNode.moveToBottom();
    }
    this.mountAttachments(width, height);
    this.nodeById.forEach(node => this.keepLabelsUpright(node));
    this.renderConnectors();
    this.syncTransformer(); this.stage.batchDraw();
  }
  private renderContext(): { width: number; height: number; resolveEndpoint: (endpoint: Endpoint, toward?: Point, margin?: number) => Point } {
    return {
      width: this.stage.width(),
      height: this.stage.height(),
      resolveEndpoint: (endpoint, toward, margin) => this.resolveEndpoint(endpoint, toward, margin)
    };
  }

  private logicalConnectorRoute(element: BoardElement): Point[] {
    const from = this.resolveEndpoint(element.from ?? { x: element.x ?? 0, y: element.y ?? 0 });
    const to = this.resolveEndpoint(element.to ?? from);
    return [from, ...(element.waypoints ?? []), to];
  }

  private renderConnectors(only?: ReadonlySet<string>): void {
    if (!only) this.connectorLayer.destroyChildren();
    const context = this.renderContext();
    for (const element of this.document.elements) {
      const definition = this.registry.getElement(element.type);
      if (definition.layer !== 'connectors' || (only && !only.has(element.id))) continue;
      if (only) this.nodeById.get(element.id)?.destroy();
      this.nodeById.delete(element.id);
      const renderedNode = definition.render(element, context);
      const node: Konva.Node = renderedNode;
      node.setAttrs({ id: element.id, name: 'sportsboard-element', draggable: false });
      if (this.interactive) {
        node.on('pointerdown', event => { if (this.mode === 'viewer') return; event.cancelBubble = true; if (this.permissions.select) this.select(element.id); });
        node.on('dblclick dbltap', event => { event.cancelBubble = true; this.activateElement(element.id); });
      }
      this.nodeById.set(element.id, node);
      this.connectorLayer.add(renderedNode);
    }
    this.connectorLayer.batchDraw();
  }

  private scheduleConnectorRender(changedElementId?: string): void {
    if (!changedElementId) this.dirtyConnectorIds = null;
    else if (this.dirtyConnectorIds) {
      const changed = this.elementById.get(changedElementId);
      if (changed && this.registry.getElement(changed.type).layer === 'connectors') this.dirtyConnectorIds.add(changedElementId);
      else {
        for (const element of this.document.elements) {
          if (this.registry.getElement(element.type).layer !== 'connectors') continue;
          const referencesChangedElement = [element.from, element.to].some(endpoint => endpoint && isElementEndpoint(endpoint) && endpoint.element === changedElementId);
          if (referencesChangedElement) this.dirtyConnectorIds.add(element.id);
        }
      }
    }
    if (this.connectorRenderFrame !== undefined) return;
    this.connectorRenderFrame = requestAnimationFrame(() => {
      this.connectorRenderFrame = undefined;
      const dirty = this.dirtyConnectorIds;
      this.dirtyConnectorIds = new Set();
      this.renderConnectors(dirty ?? undefined);
      this.syncConnectorHandlePositions();
    });
  }

  private resolveEndpoint(endpoint: Endpoint, toward?: Point, margin?: number): Point {
    if (!isElementEndpoint(endpoint)) return endpoint;
    const element = this.elementById.get(endpoint.element);
    const fallback = { x: element?.x ?? 0, y: element?.y ?? 0 };
    if (!element) return fallback;
    const node = this.nodeById.get(element.id);
    if (!node) return fallback;

    const localRect = this.connectionRectById.get(element.id)
      ?? node.getClientRect({ skipTransform: true, skipShadow: true, skipStroke: true });
    const localCenter = { x: localRect.x + localRect.width / 2, y: localRect.y + localRect.height / 2 };
    const transform = node.getAbsoluteTransform();
    const center = this.viewportToBoard(transform.point(localCenter));
    const normalizedCenter = { x: center.x / this.stage.width(), y: center.y / this.stage.height() };
    if (!toward || localRect.width <= 0 || localRect.height <= 0) return normalizedCenter;

    const target = { x: toward.x * this.stage.width(), y: toward.y * this.stage.height() };
    const localTarget = transform.copy().invert().point(this.boardToViewport(target));
    const dx = localTarget.x - localCenter.x;
    const dy = localTarget.y - localCenter.y;
    if (Math.hypot(dx, dy) < .001) return normalizedCenter;

    const radiusX = localRect.width / 2;
    const radiusY = localRect.height / 2;
    const boundary = this.registry.getElement(element.type).connectionBoundary;
    const scale = boundary?.shape === 'rectangle'
      ? 1 / Math.max(Math.abs(dx) / radiusX, Math.abs(dy) / radiusY)
      : 1 / Math.sqrt((dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY));
    const edge = this.viewportToBoard(transform.point({ x: localCenter.x + dx * scale, y: localCenter.y + dy * scale }));
    const worldDx = target.x - center.x;
    const worldDy = target.y - center.y;
    const worldDistance = Math.hypot(worldDx, worldDy);
    const requestedMargin = (margin ?? boundary?.margin ?? .007) * this.stage.width();
    const safeMargin = Math.min(requestedMargin, worldDistance * .2);
    return {
      x: (edge.x + worldDx / worldDistance * safeMargin) / this.stage.width(),
      y: (edge.y + worldDy / worldDistance * safeMargin) / this.stage.height()
    };
  }
  private connectorEndpointPosition(element: BoardElement, key: 'from' | 'to'): Point {
    const endpoint = element[key] ?? { x: element.x ?? 0, y: element.y ?? 0 };
    const waypoints = element.waypoints ?? [];
    const opposite = key === 'from'
      ? waypoints[0] ?? this.resolveEndpoint(element.to ?? endpoint)
      : waypoints.at(-1) ?? this.resolveEndpoint(element.from ?? endpoint);
    return this.resolveEndpoint(endpoint, opposite);
  }
  private endpointMagnet(point: Point, connectorId: string): { endpoint: Endpoint; point: Point } | undefined {
    const threshold = (this.options.snap?.threshold ?? .065) * this.stage.width();
    let closest: { endpoint: Endpoint; point: Point; distance: number } | undefined;
    for (const candidate of this.document.elements) {
      const definition = this.registry.getElement(candidate.type);
      if (candidate.id === connectorId || definition.layer === 'connectors' || definition.connectable === false) continue;
      const center = this.resolveEndpoint({ element: candidate.id });
      const distance = Math.hypot((point.x - center.x) * this.stage.width(), (point.y - center.y) * this.stage.height());
      if (!closest || distance < closest.distance) closest = { endpoint: { element: candidate.id }, point: center, distance };
    }
    return closest && closest.distance <= threshold ? closest : undefined;
  }
  private renderConnectorHandles(element?: BoardElement): void {
    this.connectorHandles.destroyChildren();
    if (!element || !this.permissions.editProperties || this.registry.getElement(element.type).layer !== 'connectors') return;
    const coarsePointer = usesCoarsePointer();

    const addEndpointHandle = (key: 'from' | 'to'): void => {
      const endpoint = element[key] ?? { x: element.x ?? 0, y: element.y ?? 0 };
      const position = this.connectorEndpointPosition(element, key);
      const handle = new Konva.Circle({
        name: 'sportsboard-connector-endpoint',
        endpointKey: key,
        x: position.x * this.stage.width(),
        y: position.y * this.stage.height(),
        radius: coarsePointer ? 11 : 9,
        fill: isElementEndpoint(endpoint) ? '#10b981' : '#2563eb',
        stroke: '#ffffff',
        strokeWidth: 3,
        hitStrokeWidth: coarsePointer ? 24 : 14,
        shadowColor: '#0f172a',
        shadowBlur: 5,
        shadowOpacity: .24,
        draggable: true
      });
      let beforeDrag: BoardDocument | undefined;
      let candidate: { endpoint: Endpoint; point: Point } | undefined;
      handle.on('pointerdown', event => { event.cancelBubble = true; });
      handle.on('mouseenter', () => { this.stage.container().style.cursor = 'grab'; });
      handle.on('mouseleave', () => { this.stage.container().style.cursor = ''; });
      handle.on('dragstart', () => { beforeDrag = clone(this.document); this.stage.container().style.cursor = 'grabbing'; });
      handle.on('dragmove', () => {
        const current = this.elementById.get(element.id);
        if (!current) return;
        const point = clampPoint({ x: handle.x() / this.stage.width(), y: handle.y() / this.stage.height() });
        candidate = this.endpointMagnet(point, element.id);
        current[key] = candidate?.endpoint ?? point;
        const visual = candidate ? this.connectorEndpointPosition(current, key) : point;
        handle.position({ x: visual.x * this.stage.width(), y: visual.y * this.stage.height() });
        handle.fill(candidate ? '#10b981' : '#2563eb');
        handle.stroke('#ffffff');
        this.scheduleConnectorRender(element.id);
      });
      handle.on('dragend', () => {
        this.stage.container().style.cursor = 'grab';
        if (beforeDrag) this.history.push(beforeDrag);
        this.render(); this.select(element.id); this.emitChange();
      });
      this.connectorHandles.add(handle);
    };

    addEndpointHandle('from');
    addEndpointHandle('to');
    element.waypoints?.forEach((waypoint, index) => {
      const handle = new Konva.Circle({
        name: 'sportsboard-connector-waypoint',
        waypointIndex: index,
        x: waypoint.x * this.stage.width(),
        y: waypoint.y * this.stage.height(),
        radius: coarsePointer ? 10 : 8,
        fill: '#ffffff',
        stroke: '#2563eb',
        strokeWidth: 3,
        hitStrokeWidth: coarsePointer ? 22 : 12,
        shadowColor: '#0f172a',
        shadowBlur: 5,
        shadowOpacity: .22,
        draggable: true
      });
      let beforeDrag: BoardDocument | undefined;
      handle.on('pointerdown', event => { event.cancelBubble = true; });
      handle.on('mouseenter', () => { this.stage.container().style.cursor = 'grab'; });
      handle.on('mouseleave', () => { this.stage.container().style.cursor = ''; });
      handle.on('dragstart', () => { beforeDrag = clone(this.document); this.stage.container().style.cursor = 'grabbing'; });
      handle.on('dragmove', () => {
        const current = this.elementById.get(element.id);
        if (!current?.waypoints?.[index]) return;
        current.waypoints[index] = clampPoint({ x: handle.x() / this.stage.width(), y: handle.y() / this.stage.height() });
        const clamped = current.waypoints[index];
        handle.position({ x: clamped.x * this.stage.width(), y: clamped.y * this.stage.height() });
        this.scheduleConnectorRender(element.id);
      });
      handle.on('dragend', () => {
        this.stage.container().style.cursor = 'grab';
        if (beforeDrag) this.history.push(beforeDrag);
        this.render(); this.select(element.id); this.emitChange();
      });
      handle.on('dblclick dbltap', event => { event.cancelBubble = true; this.removeWaypoint(element.id, index); });
      this.connectorHandles.add(handle);
    });
  }

  private activateElement(elementId: string): void {
    if (this.mode === 'viewer' || !this.permissions.select || !this.permissions.editProperties) return;
    this.select(elementId);
    this.dispatchEvent(new CustomEvent<BoardElementActivateDetail>('elementactivate', { detail: { elementId } }));
  }
  private syncConnectorHandlePositions(): void {
    const element = this.elementById.get(this.ui.selectedIds[0]);
    if (!element || this.registry.getElement(element.type).layer !== 'connectors') return;

    this.connectorHandles.getChildren().forEach(child => {
      const handle = child as Konva.Circle;
      const endpointKey = handle.getAttr('endpointKey') as 'from' | 'to' | undefined;
      if (endpointKey) {
        const endpoint = element[endpointKey] ?? { x: element.x ?? 0, y: element.y ?? 0 };
        const position = this.connectorEndpointPosition(element, endpointKey);
        handle.position({ x: position.x * this.stage.width(), y: position.y * this.stage.height() });
        handle.fill(isElementEndpoint(endpoint) ? '#10b981' : '#2563eb');
        return;
      }

      const waypointIndex = handle.getAttr('waypointIndex') as number | undefined;
      const waypoint = waypointIndex === undefined ? undefined : element.waypoints?.[waypointIndex];
      if (waypoint) handle.position({ x: waypoint.x * this.stage.width(), y: waypoint.y * this.stage.height() });
    });
    this.uiLayer.batchDraw();
  }
  private syncTransformer(): void {
    const element = this.elementById.get(this.ui.selectedIds[0]);
    const node = element && this.nodeById.get(element.id);
    const definition = element ? this.registry.getElement(element.type) : undefined;
    const transformable = definition?.transformable !== false;
    const resize = definition?.resize;
    this.transformer.nodes(node && this.permissions.select && transformable ? [node] : []);
    this.transformer.resizeEnabled(Boolean(resize) && this.permissions.editProperties);
    this.transformer.enabledAnchors(resize ? ['top-left', 'top-center', 'top-right', 'middle-right', 'bottom-right', 'bottom-center', 'bottom-left', 'middle-left'] : []);
    this.transformer.keepRatio(resize?.keepRatio ?? true);
    this.transformer.flipEnabled(false);
    this.transformer.boundBoxFunc((oldBox, nextBox) => constrainTransformerBox(
      oldBox,
      nextBox,
      resize,
      this.stage.width(),
      this.stage.height(),
      this.ui.zoom
    ));
    this.transformer.rotateEnabled(this.permissions.rotate);
    this.renderConnectorHandles(element);
    this.uiLayer.batchDraw();
  }
  private applySnap(node: Konva.Node): void {
    const grid = this.options.snap?.grid;
    if (!grid) return;
    const position = this.viewportToBoard(node.absolutePosition());
    const x = position.x / this.stage.width(), y = position.y / this.stage.height();
    node.absolutePosition(this.boardToViewport({ x: Math.round(x / grid) * grid * this.stage.width(), y: Math.round(y / grid) * grid * this.stage.height() }));
  }

  private keepLabelsUpright(node: Konva.Node): void {
    if (!(node instanceof Konva.Container)) return;
    node.find('.sportsboard-upright').forEach(label => label.rotation(label.rotation() - label.getAbsoluteRotation()));
    this.contentLayer.batchDraw();
  }

  private applyMagnet(node: Konva.Node, element: BoardElement): void {
    const magnet = this.registry.getElement(element.type).magnet;
    if (!magnet || this.options.snap?.elements === false) return;
    const source = this.viewportToBoard(node.absolutePosition());
    const threshold = (magnet.threshold ?? .075) * this.stage.width();
    const anchors = magnet.anchors ?? [{ x: .08, y: .28 }, { x: .92, y: .28 }];
    let closest: { element: string; anchor: Point; position: Point; distance: number } | undefined;
    for (const target of this.document.elements) {
      if (target.id === element.id || !magnet.targetTypes.includes(target.type)) continue;
      const targetNode = this.nodeById.get(target.id);
      if (!targetNode) continue;
      for (const anchor of anchors) {
        const position = this.viewportToBoard(targetNode.getAbsoluteTransform().point({ x: targetNode.width() * anchor.x, y: targetNode.height() * anchor.y }));
        const distance = Math.hypot(source.x - position.x, source.y - position.y);
        if (!closest || distance < closest.distance) closest = { element: target.id, anchor, position, distance };
      }
    }
    if (closest && closest.distance <= threshold) {
      node.absolutePosition(this.boardToViewport(closest.position));
      this.magnetCandidateById.set(element.id, { element: closest.element, anchor: closest.anchor });
    } else this.magnetCandidateById.delete(element.id);
  }

  private mountAttachments(width: number, height: number): void {
    for (const element of this.document.elements) {
      if (!element.attachment) continue;
      const node = this.nodeById.get(element.id);
      const target = this.nodeById.get(element.attachment.element);
      if (!node || !target || node === target) { delete element.attachment; continue; }
      node.moveTo(target as Konva.Container);
      node.position({ x: target.width() * element.attachment.anchor.x, y: target.height() * element.attachment.anchor.y });
      const absolute = this.viewportToBoard(node.absolutePosition());
      element.x = absolute.x / width;
      element.y = absolute.y / height;
    }
  }

  private viewportToBoard(point: Point): Point {
    return { x: (point.x - this.ui.pan.x) / this.ui.zoom, y: (point.y - this.ui.pan.y) / this.ui.zoom };
  }

  private boardToViewport(point: Point): Point {
    return { x: point.x * this.ui.zoom + this.ui.pan.x, y: point.y * this.ui.zoom + this.ui.pan.y };
  }

  private clampPan(): void {
    const minX = this.stage.width() * (1 - this.ui.zoom);
    const minY = this.stage.height() * (1 - this.ui.zoom);
    this.ui.pan = {
      x: Math.max(minX, Math.min(0, this.ui.pan.x)),
      y: Math.max(minY, Math.min(0, this.ui.pan.y))
    };
  }

  private applyViewport(): void {
    this.clampPan();
    this.stage.scale({ x: this.ui.zoom, y: this.ui.zoom });
    this.stage.position(this.ui.pan);
    this.stage.batchDraw();
    this.dispatchEvent(new CustomEvent<BoardViewportDetail>('viewportchange', { detail: { zoom: this.ui.zoom, pan: clone(this.ui.pan) } }));
  }

  private beginPan(point: Point | null): void {
    if (!point) return;
    this.panning = true;
    this.lastPanPointer = point;
    this.stage.container().style.cursor = 'grabbing';
  }

  private movePan(point: Point | null): void {
    if (!this.panning || !point || !this.lastPanPointer) return;
    this.panBy(point.x - this.lastPanPointer.x, point.y - this.lastPanPointer.y);
    this.lastPanPointer = point;
  }

  private endPan(): void {
    if (!this.panning) return;
    this.panning = false;
    this.lastPanPointer = undefined;
    this.stage.container().style.cursor = '';
  }

  private touchPoint(touch: Touch): Point {
    const rect = this.stage.container().getBoundingClientRect();
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }

  private touchCenter(touches: TouchList): Point {
    const first = this.touchPoint(touches[0]);
    const second = this.touchPoint(touches[1]);
    return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
  }

  private touchDistance(touches: TouchList): number {
    const first = this.touchPoint(touches[0]);
    const second = this.touchPoint(touches[1]);
    return Math.hypot(second.x - first.x, second.y - first.y);
  }

  private handleTouchStart(event: TouchEvent, target: Konva.Node): void {
    if (event.touches.length >= 2) {
      event.preventDefault();
      const center = this.touchCenter(event.touches);
      this.pinch = { distance: this.touchDistance(event.touches), zoom: this.ui.zoom, boardPoint: this.viewportToBoard(center) };
      this.endPan();
      return;
    }
    if (event.touches.length === 1 && (this.mode === 'viewer' || (this.ui.zoom > MIN_ZOOM && target === this.stage))) {
      event.preventDefault();
      this.beginPan(this.touchPoint(event.touches[0]));
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (event.touches.length >= 2 && this.pinch) {
      event.preventDefault();
      const center = this.touchCenter(event.touches);
      this.ui.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.pinch.zoom * this.touchDistance(event.touches) / Math.max(1, this.pinch.distance)));
      this.ui.pan = { x: center.x - this.pinch.boardPoint.x * this.ui.zoom, y: center.y - this.pinch.boardPoint.y * this.ui.zoom };
      this.applyViewport();
      return;
    }
    if (event.touches.length === 1 && this.panning) {
      event.preventDefault();
      this.movePan(this.touchPoint(event.touches[0]));
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    const wasPinching = Boolean(this.pinch);
    if (event.touches.length < 2) this.pinch = undefined;
    if (!event.touches.length) this.endPan();
    else if (event.touches.length === 1 && (this.mode === 'viewer' || wasPinching)) this.beginPan(this.touchPoint(event.touches[0]));
  }

  private withExportViewport<T>(exporter: () => T): T {
    const scale = this.stage.scale();
    const position = this.stage.position();
    const uiVisible = this.uiLayer.visible();
    this.stage.scale({ x: 1, y: 1 });
    this.stage.position({ x: 0, y: 0 });
    this.uiLayer.visible(false);
    this.stage.draw();
    try { return exporter(); }
    finally {
      this.stage.scale(scale);
      this.stage.position(position);
      this.uiLayer.visible(uiVisible);
      this.stage.draw();
    }
  }
}
