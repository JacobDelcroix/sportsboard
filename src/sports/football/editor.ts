import type { Point } from '../../core/index.js';
import type { EditorSportDefinition } from '../../editor/index.js';
import type { SportsBoardLocale } from '../../viewer/index.js';
import { Football } from './football.js';
import { resolveFootballMessages, type FootballMessages } from './i18n.js';
import { createFootballViewer } from './viewer.js';

const numberedPlayer = (number: number, messages: FootballMessages) => ({
  id: `player-${number}`,
  type: Football.elements.player,
  group: 'players',
  label: String(number),
  icon: String(number),
  description: messages.playerDescription.replace('{number}', String(number)),
  create: (point: Point) => ({ type: Football.elements.player, ...point, data: { number } })
});

/** Creates a complete localized football editor configuration. */
export function createFootballEditor(locale: SportsBoardLocale = 'en', overrides: Partial<FootballMessages> = {}): EditorSportDefinition {
  const messages = resolveFootballMessages(locale, overrides);
  return {
    ...createFootballViewer(locale, overrides),
    groups: [
      { id: 'players', label: messages.players, layout: 'grid' },
      { id: 'equipment', label: messages.equipment, layout: 'grid' },
      { id: 'movements', label: messages.movements, layout: 'list' }
    ],
    elements: [
      ...Array.from({ length: 11 }, (_, index) => numberedPlayer(index + 1, messages)),
      { id: 'ball', type: Football.elements.ball, group: 'equipment', label: messages.ball, icon: '', description: messages.ballDescription, create: point => ({ type: Football.elements.ball, ...point }) }
    ],
    connectors: [
      { id: 'run', group: 'movements', label: messages.run, icon: '→', description: messages.runDescription, target: 'either', create: (from, target) => Football.run(from, target) },
      { id: 'dribble', group: 'movements', label: messages.dribble, icon: '〰', description: messages.dribbleDescription, target: 'either', create: (from, target) => Football.dribble(from, target) },
      { id: 'pass', group: 'movements', label: messages.pass, icon: '⇢', description: messages.passDescription, target: 'either', create: (from, target) => Football.pass(from, target) },
      { id: 'shot', group: 'movements', label: messages.shot, icon: '⊕', description: messages.shotDescription, target: 'either', create: (from, target) => Football.shot(from, target) }
    ]
  };
}

export const FootballEditor = createFootballEditor();
