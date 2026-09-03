# Basketball and football

One editor or viewer element owns one sport. Sport selection belongs to the surrounding application: render a new element when the user changes sport.

## Shared editor tools

Every sport automatically receives the generic `core` tools:

- a transparent colored zone;
- multiline free text;
- a free letter or number marker;
- a hurdle;
- a pole.

These elements use native Konva shapes and do not accept movement attachments. Their stacking order is fixed: colored zones sit directly above the surface, free text sits above colored zones, then movements and regular elements render above both. Players, equipment, and routes therefore retain pointer priority where they overlap, while text can always remain readable over a zone regardless of insertion order. The colored zone is the only resizable built-in element: select it, then drag its edge or corner handles to extend it horizontally and vertically. Select a visible, unobstructed part of a background item to move or edit it. Free text accepts line breaks and up to 500 characters.

Hurdles and poles are inserted into the sport's existing Equipment section instead of creating another toolbox section.

Movements accept an optional label. Run, dribble, and pass can be converted from the Inspector without changing endpoints, element attachments, waypoints, color, or label.

## Basketball

```html
<sports-board-editor sport="basketball" locale="en"></sports-board-editor>
<sports-board-viewer sport="basketball" locale="en"></sports-board-viewer>
```

Available surfaces:

- `basketball.halfcourt`;
- `basketball.fullcourt`.

Both surfaces include 1.25 metres of usable wooden floor around every court boundary. The inset boundary lines make the playing area explicit while leaving enough room for waiting players, coaches, and equipment without overwhelming the diagram.

Available editor elements:

- attackers numbered 1–5;
- defenders numbered 1–5;
- basketball;
- cone;
- agility ladder;
- coach;
- training hoop;
- additional basket.

Available movements:

- run;
- dribble;
- pass;
- shot;
- screen.

The ball can snap to an attacker, defender, or coach and follows that element. Movements can also attach to players or coaches, never to the ball, training hoops, or additional baskets. The two additional pieces of equipment remain freely movable and rotatable.

For faster editing, select an attacker, defender, or coach before clicking the Ball tool. The new ball is immediately attached to that selection. Dragging the Ball tool onto the board still creates a freely positioned ball.

Defenders inserted on the half court start at a 180-degree rotation so the basket is naturally behind them. Full-court defenders keep the neutral orientation because either basket may be defended. This default applies only when inserting an element; rotation remains editable afterward.

Programmatic movement helpers are also exported:

```js
import { Basketball } from '@jacobdelcroix/sportsboard/basketball/viewer';

board.add(Basketball.pass('player-1', 'player-2'));
board.add(Basketball.run('player-2', { x: 0.7, y: 0.25 }));
```

## Football

```html
<sports-board-editor sport="football" locale="en"></sports-board-editor>
<sports-board-viewer sport="football" locale="en"></sports-board-viewer>
```

Available surfaces:

- `football.halfpitch`;
- `football.fullpitch`.

The playable areas use the proportions and main markings of a 105 × 68 metre pitch. The half pitch keeps a 68 × 52.5 metre playing area. Both surfaces add four metres of usable grass outside every touchline and goal line; goals are rendered in this outer area.

Available editor elements:

- players numbered 1–11;
- football.

Available movements:

- run;
- dribble;
- pass;
- shot.

The football can snap to a player and follows that player. It cannot become a movement endpoint.

Selecting a player before clicking the Ball tool attaches the new ball immediately. Dragging the tool onto the pitch remains available for free placement.

Programmatic helpers are exported in the same way:

```js
import { Football } from '@jacobdelcroix/sportsboard/football/viewer';

board.add(Football.run('player-7', { x: 0.18, y: 0.25 }));
board.add(Football.pass('player-9', 'player-10'));
```

## Localized sport labels

Set `locale="en"` or `locale="fr"` on the custom element. Applications can copy a sport JSON catalog and pass their version through `sportMessages`:

```js
import customBasketball from './locales/basketball.fr.json';

document.querySelector('sports-board-editor').options = {
  sportMessages: customBasketball
};
```

Unspecified keys fall back to the selected built-in language.

The sport factories remain available for thumbnail generation, imperative class usage, and custom integrations.
