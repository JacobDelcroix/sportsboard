# Alternative integration methods

The recommended SportsBoard integration is one application import and a declarative custom element whose JSON is passed through the `data` attribute:

```js
import '@jacobdelcroix/sportsboard/element';
```

```html
<sports-board-editor
  sport="basketball"
  locale="fr"
  data='{"schema":"sportsboard","version":1,"surface":{"type":"basketball.halfcourt"},"elements":[]}'
></sports-board-editor>
```

Use the alternatives below only when the surrounding application needs more control.

For form submission, uploads, previews, and thumbnail persistence, see [Saving diagrams and generating thumbnails](saving-and-thumbnails.md).

## Load or replace data from JavaScript

The `data` property accepts either a parsed `BoardDocument` or a JSON string:

```js
const editor = document.querySelector('sports-board-editor');
editor.data = savedDiagramJson;
```

Property values assigned before the browser registers the custom element are preserved when it upgrades.

Use `load()` when the element is already mounted and the application wants to replace its compatible document explicitly:

```js
editor.load(nextDiagramJson);
```

The equivalent string property is `value`:

```js
editor.value = nextDiagramJson;
console.log(editor.value);
```

## Embed JSON as a child script

This form can be useful when a server template produces a large JSON document and an HTML attribute would be inconvenient:

```html
<sports-board-viewer sport="basketball" locale="en">
  <script type="application/json">
    {
      "schema": "sportsboard",
      "version": 1,
      "surface": { "type": "basketball.halfcourt" },
      "elements": []
    }
  </script>
</sports-board-viewer>
```

SportsBoard reads the script when the element mounts. The script is configuration data and is not executed.

## Pass advanced options from JavaScript

Use the `options` property for callbacks, translation objects, and custom color palettes that cannot be represented conveniently as HTML attributes:

```js
const editor = document.querySelector('sports-board-editor');

editor.options = {
  showSave: true,
  messages: customEditorMessages,
  sportMessages: customBasketballMessages,
  colorPalette: clubColors,
  onSave(document) {
    console.log(document);
  }
};
```

Serializable options can also be supplied through an `options` JSON attribute, although individual attributes are easier to read for common settings:

```html
<sports-board-viewer
  sport="basketball"
  options='{"controls":false,"interactive":false}'
></sports-board-viewer>
```

HTML attributes take precedence over matching values in `options`.

## Use focused custom-element imports

The main element entry registers both components. A viewer-only application can exclude the editor interface from its bundle:

```js
import '@jacobdelcroix/sportsboard/viewer/element';
```

An editor-only entry registers the editor and the internal viewer it requires:

```js
import '@jacobdelcroix/sportsboard/editor/element';
```

These are still part of the same `@jacobdelcroix/sportsboard` npm package.

## Switch sports dynamically

One element instance owns one sport. Create a new element when the application changes sport:

```js
const currentEditor = document.querySelector('sports-board-editor');
const footballEditor = document.createElement('sports-board-editor');

footballEditor.setAttribute('sport', 'football');
footballEditor.setAttribute('locale', 'en');
footballEditor.data = footballDocument;

currentEditor.replaceWith(footballEditor);
```

A basketball document cannot be loaded into a football instance, and vice versa.

## Instantiate the classes directly

The custom elements are recommended for application pages. The imperative classes remain available for custom lifecycle management or interfaces that do not use web components.

### Editor class

```html
<div id="board-target"></div>
```

```js
import { SportsBoardEditor } from '@jacobdelcroix/sportsboard/editor';
import { createBasketballEditor } from '@jacobdelcroix/sportsboard/basketball/editor';

const editor = new SportsBoardEditor('#board-target', {
  sport: createBasketballEditor('fr'),
  data: savedDiagramJson
});
```

### Viewer class

```js
import { SportsBoardViewer } from '@jacobdelcroix/sportsboard/viewer';
import { createBasketballViewer } from '@jacobdelcroix/sportsboard/basketball/viewer';

const viewer = new SportsBoardViewer('#board-target', {
  sport: createBasketballViewer('en'),
  data: savedDiagramJson,
  controls: true
});
```

Call `destroy()` before permanently removing an imperative instance:

```js
editor.destroy();
viewer.destroy();
```

## Use the lower-level board

`SportsBoard` and `SportsBoardCanvas` are available for applications building their own interface or sport module. They require a registry and explicit lifecycle management.

```js
import { SportsBoard } from '@jacobdelcroix/sportsboard/core';
```

See the [API reference](api-reference.md#lower-level-board) and [extension guide](extending.md) before choosing this level.
