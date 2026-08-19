import type Konva from 'konva';

export type BoardMode = 'editor' | 'viewer';

export interface BoardPermissions {
  select: boolean;
  move: boolean;
  rotate: boolean;
  create: boolean;
  delete: boolean;
  editProperties: boolean;
  history: boolean;
}

export type PermissionOverrides = Partial<BoardPermissions>;

export const MODE_PRESETS: Readonly<Record<BoardMode, Readonly<BoardPermissions>>> = Object.freeze({
  editor: Object.freeze({ select: true, move: true, rotate: true, create: true, delete: true, editProperties: true, history: true }),
  viewer: Object.freeze({ select: false, move: false, rotate: false, create: false, delete: false, editProperties: false, history: false })
});

export interface Point { x: number; y: number }
export interface ElementEndpoint { element: string }
export type Endpoint = Point | ElementEndpoint;

export interface BoardElement {
  id: string;
  type: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  from?: Endpoint;
  to?: Endpoint;
  waypoints?: Point[];
  attachment?: { element: string; anchor: Point };
  style?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export type ElementInput = Omit<BoardElement, 'id'> & { id?: string };
export interface BoardDocument {
  schema: 'sportsboard';
  version: 1;
  meta?: { notes?: string; [key: string]: unknown };
  surface: { type: string; data?: Record<string, unknown> };
  elements: BoardElement[];
}

/** Ephemeral state: never emitted by toJSON()/getDocument(). */
export interface BoardUIState {
  selectedIds: string[];
  zoom: number;
  pan: Point;
}

export interface BoardViewportDetail {
  zoom: number;
  pan: Point;
}

export interface SnapOptions { grid?: number; elements?: boolean; threshold?: number }
export interface BoardOptions {
  mode?: BoardMode;
  /** Disables gestures and canvas events without changing the document. */
  interactive?: boolean;
  permissions?: PermissionOverrides;
  surface?: string;
  data?: BoardDocument | string;
  width?: number;
  height?: number;
  snap?: SnapOptions;
}

export interface BoardImageOptions {
  /** Final width in pixels. The surface ratio determines the height. */
  width?: number;
  /** Resolution multiplier used when width is omitted. */
  pixelRatio?: number;
  /** Output MIME type. */
  type?: 'image/png' | 'image/jpeg' | 'image/webp' | string;
  /** JPEG/WebP quality between 0 and 1. */
  quality?: number;
}

export interface BoardMutationOptions {
  /** Set to false to group this update into an existing history entry. */
  recordHistory?: boolean;
}

export interface RenderContext {
  width: number;
  height: number;
  resolveEndpoint(endpoint: Endpoint, toward?: Point, margin?: number): Point;
}
export interface ElementDefinition {
  defaults?: Partial<ElementInput>;
  transformable?: boolean;
  /** Allows connector endpoints to snap to this element. */
  connectable?: boolean;
  layer?: 'content' | 'connectors';
  connectionBoundary?: {
    shape?: 'ellipse' | 'rectangle';
    /** Gap around the element, relative to the surface width. */
    margin?: number;
  };
  magnet?: {
    targetTypes: string[];
    threshold?: number;
    anchors?: Point[];
  };
  render(element: BoardElement, context: RenderContext): Konva.Shape | Konva.Group;
}
export interface SurfaceDefinition {
  ratio: number;
  render(width: number, height: number, data?: Record<string, unknown>): Konva.Shape | Konva.Group;
}
export interface BoardChangeDetail { document: BoardDocument }
export interface BoardModeDetail { mode: BoardMode; permissions: BoardPermissions }
