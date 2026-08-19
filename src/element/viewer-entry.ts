export * from './types.js';
export * from './viewer-element.js';

import { defineSportsBoardViewerElement } from './viewer-element.js';

if (globalThis.customElements) defineSportsBoardViewerElement();
