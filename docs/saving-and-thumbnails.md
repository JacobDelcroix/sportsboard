# Saving diagrams and generating thumbnails

SportsBoard keeps the editable diagram as JSON. A thumbnail is a derived image that should normally be regenerated when the JSON changes.

The recommended persistence model stores:

- the JSON document as the source of truth;
- the selected sport beside the exercise or diagram;
- an optional WebP or PNG thumbnail for fast lists and previews.

## Submit JSON with a native HTML form

`<sports-board-editor>` is form-associated. When it has a `name`, its current JSON is included in `FormData` and normal browser submissions without a hidden input.

```html
<form id="exercise-form" method="post" action="/exercises/42/diagrams">
  <div class="board-shell">
    <sports-board-editor
      id="exercise-board"
      name="diagram"
      sport="basketball"
      locale="fr"
      data='{"schema":"sportsboard","version":1,"surface":{"type":"basketball.halfcourt"},"elements":[]}'
    ></sports-board-editor>
  </div>

  <button type="submit">Save exercise</button>
</form>
```

```css
.board-shell {
  width: 100%;
  height: 760px;
}
```

The submitted request contains:

```text
diagram={"schema":"sportsboard","version":1,...}
```

The editor synchronizes this form value whenever the document changes. Notes are also flushed before the document or image is read.

## Connect the built-in Save button to the form

The Save button inside SportsBoard emits a `save` event. It does not automatically submit the surrounding form because each application has its own persistence flow.

Use `requestSubmit()` to route the built-in button and the application's submit button through the same validation and submit handler:

```js
const form = document.querySelector('#exercise-form');
const editor = document.querySelector('#exercise-board');

editor.addEventListener('save', () => {
  form.requestSubmit();
});
```

To hide the built-in button and keep only the application's button:

```html
<sports-board-editor
  name="diagram"
  sport="basketball"
  show-save="false"
></sports-board-editor>
```

## Submit JSON asynchronously

`new FormData(form)` already includes the editor's JSON. Calling `body.set()` explicitly is useful as a final read and also makes the request structure obvious.

```js
const form = document.querySelector('#exercise-form');
const editor = document.querySelector('#exercise-board');
const submitButton = form.querySelector('[type="submit"]');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submitButton.disabled = true;

  try {
    const body = new FormData(form);
    body.set('diagram', editor.toJSON());

    const response = await fetch(form.action, {
      method: form.method,
      body
    });

    if (!response.ok) {
      throw new Error(`Unable to save the diagram (${response.status})`);
    }

    const result = await response.json();
    console.log('Saved diagram', result);
  } catch (error) {
    console.error(error);
  } finally {
    submitButton.disabled = false;
  }
});
```

Do not set the `Content-Type` header manually when sending `FormData`; the browser adds the required multipart boundary.

## Generate a thumbnail from the mounted editor

The editor and viewer expose the same image methods. `toBlob()` is recommended for uploads and storage:

```js
const thumbnail = await editor.toBlob({
  width: 640,
  type: 'image/webp',
  quality: 0.85
});
```

The output contains only the active field and diagram elements. Toolbars, panels, selections, handles, zoom, and pan are excluded. The surface ratio determines the image height.

Available output options:

| Option | Purpose |
| --- | --- |
| `width` | Final image width in pixels |
| `pixelRatio` | Resolution multiplier when `width` is omitted |
| `type` | `image/webp`, `image/png`, or `image/jpeg` |
| `quality` | WebP or JPEG quality between `0` and `1` |

WebP at 640 px and quality `0.85` is a practical default for exercise lists. Use a larger width such as 1200 px for detailed exports.

## Submit JSON and thumbnail in one request

```js
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const thumbnail = await editor.toBlob({
    width: 640,
    type: 'image/webp',
    quality: 0.85
  });

  const body = new FormData(form);
  body.set('diagram', editor.toJSON());
  body.set('thumbnail', thumbnail, 'diagram.webp');

  const response = await fetch(form.action, {
    method: form.method,
    body
  });

  if (!response.ok) throw new Error(`Save failed (${response.status})`);
});
```

On the server, treat `diagram` as JSON and `thumbnail` as an uploaded file.

## Display a generated preview before upload

Use an object URL for a temporary preview and revoke the previous URL to avoid keeping unused blobs in memory:

```html
<img id="diagram-preview" alt="Diagram preview" hidden>
```

```js
const preview = document.querySelector('#diagram-preview');
let previewUrl;

async function refreshPreview() {
  const thumbnail = await editor.toBlob({
    width: 640,
    type: 'image/webp',
    quality: 0.85
  });

  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(thumbnail);
  preview.src = previewUrl;
  preview.hidden = false;
}

window.addEventListener('beforeunload', () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
});
```

Do not regenerate the preview after every drag event. Generate it on Save, on explicit preview requests, or after a short application-level debounce.

## Generate a thumbnail without mounting a visible board

Use `renderSportsBoardThumbnail()` when the application has JSON but no mounted editor or viewer:

```js
import { renderSportsBoardThumbnail } from '@jacobdelcroix/sportsboard/viewer';
import { createBasketballViewer } from '@jacobdelcroix/sportsboard/basketball/viewer';

const thumbnail = await renderSportsBoardThumbnail({
  data: savedDiagramJson,
  sport: createBasketballViewer('en'),
  width: 640,
  type: 'image/webp',
  quality: 0.85
});
```

The helper creates an offscreen viewer, waits for fonts and rendering, exports the image, and destroys the temporary canvas automatically. It runs in a browser environment because Konva requires the DOM and canvas APIs.

Use `renderSportsBoardThumbnailDataURL()` only for short-lived previews that specifically require a data URL. Blob storage is more efficient for persistence.

## Support basketball and football thumbnails

Choose the viewer factory from the sport stored by the application:

```js
import { renderSportsBoardThumbnail } from '@jacobdelcroix/sportsboard/viewer';
import { createBasketballViewer } from '@jacobdelcroix/sportsboard/basketball/viewer';
import { createFootballViewer } from '@jacobdelcroix/sportsboard/football/viewer';

const sports = {
  basketball: createBasketballViewer('en'),
  football: createFootballViewer('en')
};

async function createThumbnail(sportId, diagramJson) {
  const sport = sports[sportId];
  if (!sport) throw new Error(`Unsupported sport: ${sportId}`);

  return renderSportsBoardThumbnail({
    data: diagramJson,
    sport,
    width: 640,
    type: 'image/webp',
    quality: 0.85
  });
}
```

## Exercises with multiple diagrams

Generate one thumbnail for each saved diagram. Store the first diagram's thumbnail as the exercise-list preview, while the exercise detail page can display every stored thumbnail or mount viewers only when needed.

```js
async function saveExerciseDiagrams(exerciseId, sportId, diagrams) {
  for (const [index, diagram] of diagrams.entries()) {
    const thumbnail = await createThumbnail(sportId, diagram);
    const body = new FormData();

    body.set('position', String(index));
    body.set('diagram', diagram);
    body.set('thumbnail', thumbnail, `diagram-${index + 1}.webp`);

    const response = await fetch(`/api/exercises/${exerciseId}/diagrams`, {
      method: 'POST',
      body
    });

    if (!response.ok) throw new Error(`Unable to save diagram ${index + 1}`);
  }
}
```

Processing the diagrams sequentially limits the number of simultaneous Konva canvases and reduces memory spikes.

## Laravel example

For complete Blade, Livewire 4, and Alpine.js implementations, see [Laravel, Livewire, and Alpine.js integration](laravel-livewire-alpine.md).

Blade safely escapes the stored JSON when it is rendered into the `data` attribute:

```blade
<form id="exercise-form" method="POST" action="{{ route('exercises.diagrams.store', $exercise) }}">
    @csrf

    <div wire:ignore style="height: 760px">
        <sports-board-editor
            id="exercise-board"
            name="diagram"
            sport="basketball"
            locale="fr"
            data="{{ $diagram }}"
        ></sports-board-editor>
    </div>

    <button type="submit">Enregistrer</button>
</form>
```

The same asynchronous form handler can upload the generated thumbnail. Laravel receives the fields as usual:

```php
$validated = request()->validate([
    'diagram' => ['required', 'json'],
    'thumbnail' => ['nullable', 'image', 'mimes:webp,png,jpeg'],
]);

$diagramJson = $validated['diagram'];
$thumbnailPath = request()->file('thumbnail')?->store('diagram-thumbnails', 'public');
```

Validate the SportsBoard document structure in addition to Laravel's generic `json` rule before trusting its surface, elements, or references.
