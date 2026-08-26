# API reference

SportsBoard publishes one npm package. Declarative custom elements are the recommended application API.

## Register the elements

```js
import '@jacobdelcroix/sportsboard/element';
```

The import registers:

- `<sports-board-editor>` for the complete editing interface;
- `<sports-board-viewer>` for a read-only canvas.

Both elements are responsive hosts with `width: 100%` and `height: 100%`. The editor uses container queries, so its compact tablet/mobile interface follows the space allocated by the application instead of the full browser width. They use the light DOM, so application CSS classes apply normally.

Focused imports and imperative integrations are covered in [Alternative integration methods](alternative-integrations.md).

## `<sports-board-editor>`

```html
<sports-board-editor
  sport="basketball"
  locale="fr"
  show-save
  data='{"schema":"sportsboard","version":1,"surface":{"type":"basketball.halfcourt"},"elements":[]}'
></sports-board-editor>
```

### Attributes

| Attribute | Values | Purpose |
| --- | --- | --- |
| `sport` | `basketball`, `football` | Selects the single sport owned by this instance |
| `locale` | `en`, `fr` | Selects built-in interface and sport wording |
| `surface` | surface ID | Selects the empty document's initial surface |
| `show-save` | boolean attribute | Shows or hides the built-in Save button |
| `data` | JSON string | Supplies a document when an attribute is appropriate; removing it remounts the default/fallback document |
| `options` | JSON object | Supplies serializable options from markup |
| `name` | string | Submits current JSON as a native form field |

Boolean attributes accept an empty value or `"true"`; use `"false"` to disable them explicitly.

### JavaScript options

Non-serializable values and translation objects belong on the `options` property:

```js
const editor = document.querySelector('sports-board-editor');

editor.options = {
  sport: 'basketball',
  locale: 'fr',
  data: savedDocument,
  showSave: true,
  saveLabel: 'Save diagram',
  messages: customEditorMessages,
  sportMessages: customBasketballMessages,
  colorPalette: [
    { value: '#2563eb', label: 'Club blue' },
    { value: '#dc2626', label: 'Club red' }
  ],
  onSave(document) {
    console.log(document);
  }
};
```

Markup attributes take precedence over matching property options. The element remounts when structural options such as sport, locale, or surface change.

## `<sports-board-viewer>`

```html
<sports-board-viewer
  sport="football"
  locale="en"
  controls
  interactive
></sports-board-viewer>
```

### Attributes

| Attribute | Values | Purpose |
| --- | --- | --- |
| `sport` | `basketball`, `football` | Selects the document registry |
| `locale` | `en`, `fr` | Selects navigation wording |
| `surface` | surface ID | Selects the empty document's initial surface |
| `controls` | boolean attribute | Shows zoom and reset controls |
| `interactive` | boolean attribute | Enables Cmd/Ctrl + wheel zoom, pinch, pan, and hit detection |
| `data` | JSON string | Supplies a document |
| `options` | JSON object | Supplies serializable options from markup |

JavaScript options also accept `messages` and `sportMessages` overrides.

## Data properties and methods

The editor and viewer expose the same document and image API.

| Member | Result | Purpose |
| --- | --- | --- |
| `data` | property | Gets or loads a `BoardDocument` or JSON string |
| `value` | property | Gets current compact JSON or loads a JSON string |
| `getDocument()` | `BoardDocument \| undefined` | Returns a cloned document after mount |
| `toJSON(pretty?)` | `string \| undefined` | Serializes the current document |
| `toCanvas(options?)` | `HTMLCanvasElement \| undefined` | Exports the field without interface controls |
| `toDataURL(options?)` | `string \| undefined` | Exports an image data URL |
| `toBlob(options?)` | `Promise<Blob>` | Exports an upload-ready image |
| `load(data)` | `void` | Validates and loads a compatible document |
| `mount()` | instance | Mounts immediately instead of waiting for automatic connection |
| `destroy()` | `void` | Releases canvas resources |

Image options accept `width`, `pixelRatio`, `type`, and `quality`. A supplied output width preserves the surface ratio.

The viewer additionally exposes `getBoard()` for advanced integrations. The editor keeps its lower-level board available from `editor.instance?.getBoard()`.

## Events

All custom-element events bubble and cross composition boundaries.

```js
editor.addEventListener('change', ({ detail }) => {
  console.log(detail.document, detail.json);
});

editor.addEventListener('save', ({ detail }) => {
  console.log(detail.document, detail.json);
});

viewer.addEventListener('viewportchange', ({ detail }) => {
  console.log(detail.zoom, detail.pan);
});
```

| Event | Source | Detail |
| --- | --- | --- |
| `ready` | both | `{ document, mode, sport }` |
| `change` | editor | `{ document, json }` |
| `save` | editor | `{ document, json }` |
| `status` | editor | `{ message, tone }` |
| `viewportchange` | both | `{ zoom, pan }` |
| `error` | both | `{ error }` |

## TypeScript

```ts
import type {
  SportsBoardEditorElement,
  SportsBoardElementChangeDetail
} from '@jacobdelcroix/sportsboard/element';

const editor = document.querySelector<SportsBoardEditorElement>('sports-board-editor')!;

editor.addEventListener('change', event => {
  const detail = (event as CustomEvent<SportsBoardElementChangeDetail>).detail;
  console.log(detail.json);
});
```

## Thumbnail helpers

Use an offscreen helper when generating an image without showing a live element:

```js
import {
  renderSportsBoardThumbnail,
  renderSportsBoardThumbnailDataURL
} from '@jacobdelcroix/sportsboard/viewer';
import { createBasketballViewer } from '@jacobdelcroix/sportsboard/basketball/viewer';

const blob = await renderSportsBoardThumbnail({
  data: savedDocument,
  sport: createBasketballViewer('en'),
  width: 640,
  type: 'image/webp',
  quality: 0.85
});
```

`renderSportsBoardThumbnail()` returns a `Blob`. `renderSportsBoardThumbnailDataURL()` returns a data URL. Both create and destroy their temporary canvas automatically.

See [Saving diagrams and generating thumbnails](saving-and-thumbnails.md) for complete submit, upload, preview, Laravel, and multi-diagram flows.

## Imperative classes

Applications that build a fully custom integration can still instantiate the lower-level classes.

```js
import { SportsBoardEditor } from '@jacobdelcroix/sportsboard/editor';
import { createBasketballEditor } from '@jacobdelcroix/sportsboard/basketball/editor';

const editor = new SportsBoardEditor('#target', {
  sport: createBasketballEditor('en'),
  data: savedDocument
});
```

```js
import { SportsBoardViewer } from '@jacobdelcroix/sportsboard/viewer';
import { createBasketballViewer } from '@jacobdelcroix/sportsboard/basketball/viewer';

const viewer = new SportsBoardViewer('#target', {
  sport: createBasketballViewer('en'),
  data: savedDocument,
  controls: true
});
```

The custom elements wrap these application-level APIs. Inside the editor, the field itself is a `<sports-board-viewer>` configured with editor permissions.

## Document format

SportsBoard serializes business data only. Konva nodes, selection, handles, zoom, and pan are not stored.

```ts
interface BoardDocument {
  schema: 'sportsboard';
  version: 1;
  meta?: { notes?: string; [key: string]: unknown };
  surface: {
    type: string;
    data?: Record<string, unknown>;
  };
  elements: BoardElement[];
}
```

Coordinates range from `0` to `1`. Movement endpoints are either free points or element references:

```ts
type Endpoint = { x: number; y: number } | { element: string };
```

Built-in generic elements use these public type IDs:

| Tool | Element type |
| --- | --- |
| Transparent colored zone | `core.zone` |
| Multiline free text | `core.text` |
| Free number or letter | `core.marker` |
| Hurdle | `core.hurdle` |
| Pole | `core.pole` |

Text and marker values live in `element.data.text`. Free text accepts line breaks and up to 500 characters in the built-in editor. Colored zones are the only built-in elements with resize handles; their normalized `width` and `height` are stored in the document. A movement's optional label lives in `element.data.label`:

```js
{
  id: 'run-1',
  type: 'core.connector',
  from: { element: 'player-1' },
  to: { x: 0.75, y: 0.25 },
  style: { color: '#2563eb', line: 'solid' },
  data: { movement: 'run', label: 'Backdoor cut' }
}
```

The editor converts `run`, `dribble`, and `pass` by updating `data.movement` and `style.line`; route geometry and attachments are preserved.

Documents are validated against the active sport registry before loading. Unknown surfaces or elements, duplicate IDs, invalid coordinates, broken references, invalid attachments, and attachment cycles are rejected atomically.

## Lower-level board

```js
import { SportsBoard } from '@jacobdelcroix/sportsboard/core';
```

`SportsBoard` is intended for custom interfaces and sport extensions. It exposes mutations (`add`, `update`, `remove`, `clear`), history (`undo`, `redo`), selection, surface changes, waypoint editing, permissions, zoom, pan, serialization, and image export. Pass `{ recordHistory: false }` as the third argument to `update()` when coalescing several live property inputs into one undo step.

## Localization catalogs

The package exports English and French JSON files:

```text
@jacobdelcroix/sportsboard/editor/locales/en.json
@jacobdelcroix/sportsboard/editor/locales/fr.json
@jacobdelcroix/sportsboard/viewer/locales/en.json
@jacobdelcroix/sportsboard/viewer/locales/fr.json
@jacobdelcroix/sportsboard/basketball/locales/en.json
@jacobdelcroix/sportsboard/basketball/locales/fr.json
@jacobdelcroix/sportsboard/football/locales/en.json
@jacobdelcroix/sportsboard/football/locales/fr.json
```

Copy the relevant files into the application, keep their keys, customize their values, and pass the imported objects through `messages` and `sportMessages`.
