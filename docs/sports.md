# Basketball and football

One editor or viewer element owns one sport. Sport selection belongs to the surrounding application: render a new element when the user changes sport.

## Basketball

```html
<sports-board-editor sport="basketball" locale="en"></sports-board-editor>
<sports-board-viewer sport="basketball" locale="en"></sports-board-viewer>
```

Available surfaces:

- `basketball.halfcourt`;
- `basketball.fullcourt`.

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

The ball can snap to an attacker or defender and follows that player. Movements attach to players, never to the ball, training hoops, or additional baskets. The two additional pieces of equipment remain freely movable and rotatable.

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

The surfaces use the proportions and main markings of a 105 × 68 metre pitch. The half pitch keeps the 68 × 52.5 ratio.

Available editor elements:

- players numbered 1–11;
- football.

Available movements:

- run;
- dribble;
- pass;
- shot.

The football can snap to a player and follows that player. It cannot become a movement endpoint.

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
