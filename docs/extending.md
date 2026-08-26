# Extending SportsBoard

SportsBoard separates document types from Konva rendering through `Registry`. A sport module registers surfaces and element definitions, then exposes viewer and editor configurations.

## Add a surface

```ts
import Konva from 'konva';
import type { Registry } from '@jacobdelcroix/sportsboard/core';

export function registerFootballSurfaces(registry: Registry): Registry {
  return registry.registerSurface('football.fullpitch', {
    ratio: 105 / 68,
    render(width, height) {
      const group = new Konva.Group();
      group.add(new Konva.Rect({ width, height, fill: '#15803d' }));
      // Add field markings with native Konva shapes.
      return group;
    }
  });
}
```

Surface renderers receive pixel dimensions but documents keep normalized positions.

## Add an element

```ts
registry.registerElement('football.player', {
  defaults: {
    width: 0.045,
    height: 0.045,
    style: { color: '#2563eb' }
  },
  connectionBoundary: {
    shape: 'ellipse',
    margin: 0.008
  },
  render(element, context) {
    const radius = (element.width ?? 0.045) * context.width / 2;
    return new Konva.Circle({
      x: (element.x ?? 0) * context.width,
      y: (element.y ?? 0) * context.height,
      radius,
      fill: String(element.style?.color ?? '#2563eb')
    });
  }
});
```

Use native Konva shapes and groups. There is no SVG requirement. This keeps hit detection, rotation, exports, and responsive rendering consistent.

Useful definition options:

- `defaults`: initial dimensions, style, and data;
- `layer: 'background'`: render directly above the sport surface, suitable for colored zones;
- `layer: 'annotations'`: render above background items and below movements and regular elements, suitable for free text;
- `layer: 'connectors'`: render movements above background and annotation items and below regular content;
- `transformable: false`: exclude from rotation controls;
- `resize`: enable bounded resize handles for this element only;
- `connectable: false`: prevent editor endpoint snapping;
- `connectionBoundary`: control the shape and margin used by attached routes;
- `magnet`: allow an object to attach to selected element types.

Movement definitions should also use `connectable: false`. This prevents imported JSON from attaching one movement endpoint to another movement.

## Add a movement

Movement elements use `from`, `to`, optional `waypoints`, and the built-in `core.connector` renderer. `data.movement` identifies the movement and `data.label` can provide a short visible label.

```ts
const movement = {
  type: 'core.connector',
  from: { element: 'player-1' },
  to: { x: 0.7, y: 0.25 },
  waypoints: [{ x: 0.55, y: 0.5 }],
  style: { color: '#2563eb', line: 'solid' },
  data: { movement: 'run', label: 'Curl cut' }
};
```

## Expose viewer and editor definitions

```ts
export const FootballViewer = {
  id: 'football',
  label: 'Football',
  surfaces: [{ id: 'football.fullpitch', label: 'Full pitch' }],
  createRegistry
};

export const FootballEditor = {
  ...FootballViewer,
  groups: [{ id: 'players', label: 'Players', layout: 'grid' }],
  elements: [/* palette tools */],
  connectors: [/* movement tools */]
};
```

Keep library code, comments, API names, default labels, and documentation in English. Consumers can localize labels and the editor/viewer `messages` options.

Set each connector tool's `target` to control its initial start:

- `point`: always starts as a free point;
- `element`: requires a selected connectable element;
- `either`: attaches to a valid selection or falls back to a free point.

For localized sport modules, expose `createSportEditor(locale, overrides)` and `createSportViewer(locale, overrides)` factories backed by JSON catalogs. Keep English as the default and merge application overrides after the selected catalog.
