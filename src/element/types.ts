import type { BoardDocument, BoardImageOptions } from '../core/index.js';
import type { EditorColorOption, EditorMessages } from '../editor/types.js';
import type { BasketballMessages } from '../sports/basketball/i18n.js';
import type { FootballMessages } from '../sports/football/i18n.js';
import type { SportsBoardLocale, ViewerMessages } from '../viewer/types.js';

export type BuiltInSport = 'basketball' | 'football';
export type SportsBoardSportMessages = Partial<BasketballMessages> | Partial<FootballMessages>;

export interface SportsBoardElementOptions {
  sport?: BuiltInSport;
  locale?: SportsBoardLocale;
  data?: BoardDocument | string;
  surface?: string;
  sportMessages?: SportsBoardSportMessages;
}

export interface SportsBoardViewerElementOptions extends SportsBoardElementOptions {
  controls?: boolean;
  interactive?: boolean;
  messages?: Partial<ViewerMessages>;
}

export interface SportsBoardEditorElementOptions extends SportsBoardElementOptions {
  showSave?: boolean;
  saveLabel?: string;
  messages?: Partial<EditorMessages>;
  colorPalette?: EditorColorOption[];
  onSave?(document: BoardDocument): void;
}

export interface SportsBoardElementReadyDetail {
  document: BoardDocument;
  mode: 'editor' | 'viewer';
  sport: BuiltInSport;
}

export interface SportsBoardElementChangeDetail {
  document: BoardDocument;
  json: string;
}

export interface SportsBoardElementSaveDetail extends SportsBoardElementChangeDetail {}

export interface SportsBoardElementErrorDetail {
  error: Error;
}

export type SportsBoardElementImageOptions = BoardImageOptions;

declare global {
  interface HTMLElementTagNameMap {
    'sports-board-editor': import('./editor-element.js').SportsBoardEditorElement;
    'sports-board-viewer': import('./viewer-element.js').SportsBoardViewerElement;
  }
}
