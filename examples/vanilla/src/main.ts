import type { BoardDocument, BoardMode } from '@jacobdelcroix/sportsboard/core';
import { Basketball, createBasketballViewer } from '@jacobdelcroix/sportsboard/basketball/viewer';
import { Football, createFootballViewer } from '@jacobdelcroix/sportsboard/football/viewer';
import '@jacobdelcroix/sportsboard/element';
import { SportsBoardEditorElement, SportsBoardViewerElement, type BuiltInSport } from '@jacobdelcroix/sportsboard/element';
import { renderSportsBoardThumbnail, type SportsBoardLocale } from '@jacobdelcroix/sportsboard/viewer';
import './style.css';

const basketballDocument: BoardDocument = {
  schema: 'sportsboard',
  version: 1,
  meta: { notes: 'Create spacing, draw the defender, then make the pass at the right time.' },
  surface: { type: Basketball.surfaces.halfCourt },
  elements: [
    { id: 'player-1', type: Basketball.elements.attacker, x: .5, y: .72, data: { number: 1 } },
    { id: 'player-2', type: Basketball.elements.attacker, x: .25, y: .53, data: { number: 2 } },
    { id: 'player-3', type: Basketball.elements.attacker, x: .76, y: .42, data: { number: 3 } },
    { id: 'defender-1', type: Basketball.elements.defender, x: .48, y: .47, data: { number: 1 } },
    { id: 'coach', type: Basketball.elements.coach, x: .1, y: .82 },
    { id: 'ball-1', type: Basketball.elements.ball, x: .55, y: .69, attachment: { element: 'player-1', anchor: { x: .94, y: .28 } } },
    { id: 'cone-1', type: Basketball.elements.cone, x: .15, y: .32 },
    { id: 'cone-2', type: Basketball.elements.cone, x: .85, y: .32 },
    { id: 'run-1', ...Basketball.run('player-1', { x: .68, y: .28 }), waypoints: [{ x: .42, y: .58 }, { x: .61, y: .43 }] },
    { id: 'pass-1', ...Basketball.pass('player-2', 'player-3') }
  ]
};

const footballDocument: BoardDocument = {
  schema: 'sportsboard',
  version: 1,
  meta: { notes: 'Move the ball quickly, overlap on the wing, then attack the penalty area.' },
  surface: { type: Football.surfaces.halfPitch },
  elements: [
    { id: 'player-7', type: Football.elements.player, x: .22, y: .61, data: { number: 7 } },
    { id: 'player-9', type: Football.elements.player, x: .53, y: .68, data: { number: 9 } },
    { id: 'player-10', type: Football.elements.player, x: .72, y: .48, data: { number: 10 } },
    { id: 'ball-1', type: Football.elements.ball, x: .57, y: .65, attachment: { element: 'player-9', anchor: { x: .94, y: .3 } } },
    { id: 'run-1', ...Football.run('player-7', { x: .18, y: .25 }), waypoints: [{ x: .14, y: .47 }, { x: .2, y: .36 }] },
    { id: 'pass-1', ...Football.pass('player-9', 'player-10') }
  ]
};

const urlParameters = new URLSearchParams(window.location.search);
let locale: SportsBoardLocale = urlParameters.get('lang') === 'fr' ? 'fr' : 'en';
const createDemoSports = () => [
  { id: 'basketball' as const, viewer: createBasketballViewer(locale) },
  { id: 'football' as const, viewer: createFootballViewer(locale) }
];
const initialDocumentFor = (sportId: BuiltInSport): BoardDocument => sportId === 'football' ? footballDocument : basketballDocument;
let demoSports = createDemoSports();
const languageSelect = document.querySelector<HTMLSelectElement>('#demo-language')!;
const sportSelect = document.querySelector<HTMLSelectElement>('#demo-sport')!;
const editorButton = document.querySelector<HTMLButtonElement>('#mode-editor')!;
const viewerButton = document.querySelector<HTMLButtonElement>('#mode-viewer')!;
const jsonArea = document.querySelector<HTMLTextAreaElement>('#demo-json')!;
const jsonStatus = document.querySelector<HTMLSpanElement>('#json-status')!;
const jsonFeedback = document.querySelector<HTMLParagraphElement>('#json-feedback')!;
const jsonFile = document.querySelector<HTMLInputElement>('#json-file')!;
const imageStatus = document.querySelector<HTMLSpanElement>('#image-status')!;
const imageFeedback = document.querySelector<HTMLParagraphElement>('#image-feedback')!;
const previewImage = document.querySelector<HTMLImageElement>('#preview-image')!;
const previewEmpty = document.querySelector<HTMLDivElement>('.demo-preview__empty')!;
const downloadImage = document.querySelector<HTMLAnchorElement>('#download-image')!;
const generateImageButton = document.querySelector<HTMLButtonElement>('#generate-image')!;
const imageWidthSelect = document.querySelector<HTMLSelectElement>('#image-width')!;
const imageFormatSelect = document.querySelector<HTMLSelectElement>('#image-format')!;
const integrationHost = document.querySelector<HTMLElement>('.demo-integration')!;
const containerWidthInput = document.querySelector<HTMLInputElement>('#demo-container-width')!;
const containerHeightInput = document.querySelector<HTMLInputElement>('#demo-container-height')!;
const containerWidthValue = document.querySelector<HTMLOutputElement>('#demo-container-width-value')!;
const containerHeightValue = document.querySelector<HTMLOutputElement>('#demo-container-height-value')!;
const containerSizeOutput = document.querySelector<HTMLOutputElement>('#demo-size-output')!;
let mode: BoardMode = urlParameters.get('mode') === 'viewer' ? 'viewer' : 'editor';
let activeSport = demoSports[0];
let integration!: SportsBoardEditorElement | SportsBoardViewerElement;
let previewUrl: string | null = null;
const previewSizes: Record<BoardMode, { width: number; height: number }> = {
  editor: { width: 1280, height: 760 },
  viewer: { width: 640, height: 520 }
};

const applyContainerSize = (): void => {
  const size = previewSizes[mode];
  containerWidthInput.value = String(size.width);
  containerHeightInput.value = String(size.height);
  containerWidthValue.value = `${size.width} px`;
  containerHeightValue.value = `${size.height} px`;
  integrationHost.style.width = `${size.width}px`;
  integrationHost.style.height = `${size.height}px`;
  requestAnimationFrame(() => {
    const bounds = integrationHost.getBoundingClientRect();
    containerSizeOutput.value = `${Math.round(bounds.width)} × ${Math.round(bounds.height)} px`;
  });
};

const updateContainerSize = (): void => {
  previewSizes[mode] = { width: Number(containerWidthInput.value), height: Number(containerHeightInput.value) };
  applyContainerSize();
};

const setStatus = (target: HTMLElement, message: string, tone: 'neutral' | 'success' | 'warning' | 'error' = 'neutral'): void => {
  target.textContent = message;
  target.dataset.tone = tone;
};

const markImageStale = (): void => {
  if (previewUrl) setStatus(imageStatus, 'Needs update', 'warning');
};

const currentDocument = (): BoardDocument => integration.getDocument() ?? initialDocumentFor(activeSport.id);

const syncJSON = (document = currentDocument(), invalidatePreview = true): void => {
  jsonArea.value = JSON.stringify(document, null, 2);
  setStatus(jsonStatus, 'Synchronized', 'success');
  jsonFeedback.textContent = '';
  if (invalidatePreview) markImageStale();
};

const mountIntegration = (data?: BoardDocument): void => {
  const element = document.createElement(mode === 'editor' ? 'sports-board-editor' : 'sports-board-viewer') as SportsBoardEditorElement | SportsBoardViewerElement;
  element.id = 'app';
  element.className = 'demo-board';
  element.setAttribute('aria-label', mode === 'editor' ? 'SportsBoard tactical editor' : 'SportsBoard tactical viewer');
  if (element instanceof SportsBoardEditorElement) {
    element.options = {
      data,
      sport: activeSport.id,
      locale,
      onSave(document) { localStorage.setItem('sportsboard-demo', JSON.stringify(document)); }
    };
    element.addEventListener('save', event => console.info('SportsBoard JSON', (event as CustomEvent<{ json: string }>).detail.json));
    element.addEventListener('change', event => syncJSON((event as CustomEvent<{ document: BoardDocument }>).detail.document));
  } else {
    element.options = { data, sport: activeSport.id, locale, controls: true };
  }
  element.addEventListener('ready', event => {
    syncJSON((event as CustomEvent<{ document: BoardDocument }>).detail.document, false);
  }, { once: true });
  integration = element;
  integrationHost.replaceChildren(element);
};

const renderMode = (): void => {
  document.body.dataset.displayMode = mode;
  editorButton.classList.toggle('is-active', mode === 'editor');
  viewerButton.classList.toggle('is-active', mode === 'viewer');
  const url = new URL(window.location.href);
  if (mode === 'viewer') url.searchParams.set('mode', 'viewer'); else url.searchParams.delete('mode');
  window.history.replaceState({}, '', url);
  applyContainerSize();
};

const populateSportSelect = (): void => {
  sportSelect.replaceChildren(...demoSports.map(sport => new Option(sport.viewer.label, sport.id)));
  sportSelect.value = activeSport.id;
};

languageSelect.value = locale;
populateSportSelect();
languageSelect.addEventListener('change', () => {
  const current = currentDocument();
  const activeSportId = activeSport.id;
  locale = languageSelect.value as SportsBoardLocale;
  demoSports = createDemoSports();
  activeSport = demoSports.find(sport => sport.id === activeSportId) ?? demoSports[0];
  populateSportSelect();
  const compatible = activeSport.viewer.surfaces.some(surface => surface.id === current.surface.type);
  mountIntegration(compatible ? current : initialDocumentFor(activeSport.id));
  const url = new URL(window.location.href);
  if (locale === 'fr') url.searchParams.set('lang', 'fr'); else url.searchParams.delete('lang');
  window.history.replaceState({}, '', url);
});

sportSelect.addEventListener('change', () => {
  const selectedSport = demoSports.find(sport => sport.id === sportSelect.value as BuiltInSport) ?? demoSports[0];
  const current = currentDocument();
  const compatible = selectedSport.viewer.surfaces.some(surface => surface.id === current.surface.type);
  activeSport = selectedSport;
  mountIntegration(compatible ? current : initialDocumentFor(selectedSport.id));
  markImageStale();
});

const switchMode = (nextMode: BoardMode): void => {
  if (nextMode === mode) return;
  const current = currentDocument();
  mode = nextMode;
  mountIntegration(current);
  renderMode();
};

editorButton.addEventListener('click', () => switchMode('editor'));
viewerButton.addEventListener('click', () => switchMode('viewer'));
containerWidthInput.addEventListener('input', updateContainerSize);
containerHeightInput.addEventListener('input', updateContainerSize);
document.querySelectorAll<HTMLButtonElement>('[data-preview-size]').forEach(button => button.addEventListener('click', () => {
  const [width, height] = button.dataset.previewSize!.split('x').map(Number);
  previewSizes[mode] = { width, height };
  applyContainerSize();
}));
new ResizeObserver(() => {
  const bounds = integrationHost.getBoundingClientRect();
  containerSizeOutput.value = `${Math.round(bounds.width)} × ${Math.round(bounds.height)} px`;
}).observe(integrationHost);

jsonArea.addEventListener('input', () => {
  setStatus(jsonStatus, 'Modified', 'warning');
  jsonFeedback.textContent = 'Select “Load this JSON” to display it in the playground.';
});

const loadJSON = (): void => {
  try {
    const document = JSON.parse(jsonArea.value) as BoardDocument;
    const compatibleSport = demoSports.find(sport => sport.viewer.surfaces.some(surface => surface.id === document.surface?.type));
    if (!compatibleSport) throw new Error(`No playground sport supports surface “${document.surface?.type ?? 'unknown'}”.`);
    if (compatibleSport !== activeSport) {
      activeSport = compatibleSport;
      sportSelect.value = compatibleSport.id;
      mountIntegration(document);
      markImageStale();
    } else {
      integration.load(document);
      syncJSON();
    }
    jsonFeedback.textContent = 'JSON loaded into the playground.';
  } catch (error) {
    setStatus(jsonStatus, 'Invalid JSON', 'error');
    jsonFeedback.textContent = (error as Error).message;
  }
};

document.querySelector<HTMLButtonElement>('#load-json')!.addEventListener('click', loadJSON);
document.querySelector<HTMLButtonElement>('#import-json')!.addEventListener('click', () => jsonFile.click());
jsonFile.addEventListener('change', async () => {
  const file = jsonFile.files?.[0];
  if (!file) return;
  try {
    jsonArea.value = await file.text();
    loadJSON();
  } catch (error) {
    setStatus(jsonStatus, 'Import failed', 'error');
    jsonFeedback.textContent = (error as Error).message;
  } finally {
    jsonFile.value = '';
  }
});

document.querySelector<HTMLButtonElement>('#copy-json')!.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(jsonArea.value);
    jsonFeedback.textContent = 'JSON copied to the clipboard.';
  } catch {
    jsonArea.select();
    jsonFeedback.textContent = 'The JSON is selected. Use your browser copy command.';
  }
});

generateImageButton.addEventListener('click', async () => {
  generateImageButton.disabled = true;
  setStatus(imageStatus, 'Generating…');
  imageFeedback.textContent = '';
  try {
    const width = Number(imageWidthSelect.value);
    const type = imageFormatSelect.value;
    const blob = await renderSportsBoardThumbnail({
      data: currentDocument(),
      sport: activeSport.viewer,
      width,
      type,
      quality: .88
    });
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(blob);
    previewImage.src = previewUrl;
    previewImage.hidden = false;
    previewEmpty.hidden = true;
    const extension = type === 'image/png' ? 'png' : 'webp';
    downloadImage.href = previewUrl;
    downloadImage.download = `sportsboard-${width}px.${extension}`;
    downloadImage.hidden = false;
    const bitmap = await createImageBitmap(blob);
    imageFeedback.textContent = `${bitmap.width} × ${bitmap.height} px · ${(blob.size / 1024).toFixed(1)} KB · ${extension.toUpperCase()}`;
    bitmap.close();
    setStatus(imageStatus, 'Ready', 'success');
  } catch (error) {
    setStatus(imageStatus, 'Failed', 'error');
    imageFeedback.textContent = (error as Error).message;
  } finally {
    generateImageButton.disabled = false;
  }
});

imageWidthSelect.addEventListener('change', markImageStale);
imageFormatSelect.addEventListener('change', markImageStale);
window.addEventListener('beforeunload', () => { if (previewUrl) URL.revokeObjectURL(previewUrl); });

mountIntegration(initialDocumentFor(activeSport.id));
renderMode();
