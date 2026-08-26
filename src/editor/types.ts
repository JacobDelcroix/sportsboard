import type { BoardDocument, ElementInput, Endpoint, Point, SportsBoard } from '../core/index.js';
import type { SportsBoardLocale, ViewerMessages, ViewerSportDefinition, ViewerSurface } from '../viewer/index.js';

export type { SportsBoardLocale } from '../viewer/index.js';

export interface EditorSurface extends ViewerSurface {
  label: string;
}

export interface EditorToolGroup {
  id: string;
  label: string;
  layout?: 'grid' | 'list';
}

export interface EditorElementTool {
  id: string;
  type?: string;
  group: string;
  label: string;
  icon: string;
  description?: string;
  create(point: Point, board: SportsBoard): ElementInput;
}

export interface EditorConnectorTool {
  id: string;
  group: string;
  label: string;
  icon: string;
  description?: string;
  /** Controls whether the connector's initial start requires an element, a free point, or either. */
  target: 'element' | 'point' | 'either';
  defaultLength?: number;
  defaultDirection?: Point;
  create(from: Endpoint, target: Endpoint): ElementInput;
}

export interface EditorSportDefinition extends ViewerSportDefinition {
  surfaces: EditorSurface[];
  groups: EditorToolGroup[];
  elements: EditorElementTool[];
  connectors: EditorConnectorTool[];
}

export interface EditorMessages extends ViewerMessages {
  surfaceLabel: string;
  undo: string;
  redo: string;
  deleteSelection: string;
  clearBoard: string;
  save: string;
  help: string;
  close: string;
  toolboxLabel: string;
  inspectorLabel: string;
  boardPanel: string;
  mobileNavigation: string;
  properties: string;
  number: string;
  color: string;
  textValue: string;
  movementLabel: string;
  movementLabelPlaceholder: string;
  movementType: string;
  movementRun: string;
  movementDribble: string;
  movementPass: string;
  route: string;
  addWaypoint: string;
  routeHint: string;
  notes: string;
  notesPlaceholder: string;
  notesAutosave: string;
  palette: string;
  documentColors: string;
  colorOption: string;
  annotations: string;
  genericEquipment: string;
  zone: string;
  freeText: string;
  textDefault: string;
  freeMarker: string;
  hurdle: string;
  pole: string;
  surfaceActivated: string;
  dropElement: string;
  elementAdded: string;
  connectorAddedFromSelection: string;
  connectorAddedAtCenter: string;
  waypointsAdded: string;
  numberUpdated: string;
  textUpdated: string;
  movementUpdated: string;
  selectionRequired: string;
  elementDeleted: string;
  actionUndone: string;
  actionRedone: string;
  noActionAvailable: string;
  boardCleared: string;
  boardAlreadyEmpty: string;
  boardReadyToSave: string;
  colorUpdated: string;
  copied: string;
  pasted: string;
  cut: string;
  clipboardEmpty: string;
  helpTitle: string;
  helpIntro: string;
  helpBasicsTitle: string;
  helpBasicsSelect: string;
  helpBasicsAdd: string;
  helpBasicsMove: string;
  helpBasicsZoom: string;
  helpShortcutsTitle: string;
  shortcutCopy: string;
  shortcutPaste: string;
  shortcutCut: string;
  shortcutDelete: string;
  shortcutUndo: string;
  shortcutRedo: string;
  shortcutDeselect: string;
  shortcutHelp: string;
}

export interface SportsBoardEditorOptions {
  data?: BoardDocument | string;
  /** One editor instance owns exactly one sport definition. */
  sport: EditorSportDefinition;
  surface?: string;
  saveLabel?: string;
  showSave?: boolean;
  colorPalette?: EditorColorOption[];
  /** Selects one of the built-in JSON message catalogs. Defaults to English. */
  locale?: SportsBoardLocale;
  /** Overrides the English UI messages. Values may contain {label} or {count}. */
  messages?: Partial<EditorMessages>;
  onSave?(document: BoardDocument): void;
}

export interface EditorSaveDetail {
  document: BoardDocument;
  json: string;
}

export interface EditorColorOption {
  value: string;
  label: string;
}
