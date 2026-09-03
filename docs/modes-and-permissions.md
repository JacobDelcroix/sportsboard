# Modes and permissions

SportsBoard provides two presets:

- `editor`: selection and mutations are enabled;
- `viewer`: selection and all mutations are disabled.

For normal application integration, choose the corresponding custom element:

```html
<sports-board-editor sport="basketball"></sports-board-editor>
<sports-board-viewer sport="basketball"></sports-board-viewer>
```

The editor composes the viewer element internally with editor permissions. The public viewer always remains read-only.

The lower-level board API can change modes directly:

```ts
board.setMode('viewer');
board.setMode('editor');
```

Permissions cover `select`, `move`, `rotate`, `create`, `delete`, `editProperties`, and `history`.

```ts
board.setMode('editor', {
  delete: false,
  rotate: false
});
```

Permissions are enforced by both the visual interactions and public mutation methods. A viewer cannot bypass the restriction by calling `add()`, `update()`, or `remove()` directly.

Zoom and pan remain available in viewer mode when `interactive` is enabled because they only affect ephemeral UI state. A normal wheel gesture is left to the surrounding page; wheel zoom requires `Cmd` or `Ctrl`.

## Editor interaction model

The full editor provides its own keyboard and touch interaction layer. Copy, cut, paste, delete, undo, and redo apply to the current selection. The left and right arrow keys rotate a transformable selection by ten degrees per key press. Keyboard commands are ignored while the user is typing in the number, text, movement label, movement type, or notes fields. Pasted elements receive a small offset and a new ID; attached items and connector endpoints are pasted as independent, movable geometry.

Board notes are edited in a dedicated drawer and synchronized with `document.meta.notes` on every input. The drawer fills the editor on compact layouts, while element-specific fields remain in the Inspector panel.

Note-only changes are marked as metadata updates internally. The editor still emits its normal `change` event, but it does not rebuild the board color palette when no element color changed.

At compact container widths, the editor exposes separate Tools, Board, and Inspector panels. This layout is controlled by the editor container width and requires no application-side media query.
