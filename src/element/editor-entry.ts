export * from './types.js';
export * from './editor-element.js';

import { defineSportsBoardEditorElement } from './editor-element.js';
import { defineSportsBoardViewerElement } from './viewer-element.js';

if (globalThis.customElements) {
  defineSportsBoardViewerElement();
  defineSportsBoardEditorElement();
}
