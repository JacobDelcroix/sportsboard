import type { Point, SportsBoard } from '../../core/index.js';
import type { EditorSportDefinition } from '../../editor/index.js';
import type { SportsBoardLocale } from '../../viewer/index.js';
import { Basketball } from './basketball.js';
import { resolveBasketballMessages, type BasketballMessages } from './i18n.js';
import { createBasketballViewer } from './viewer.js';

const numbered = (kind: 'attacker' | 'defender', number: number, messages: BasketballMessages) => ({
  id: `${kind}-${number}`,
  type: Basketball.elements[kind],
  group: kind === 'attacker' ? 'attackers' : 'defenders',
  label: String(number),
  icon: String(number),
  description: (kind === 'attacker' ? messages.attackerDescription : messages.defenderDescription).replace('{number}', String(number)),
  create: (point: Point, board: SportsBoard) => ({
    type: Basketball.elements[kind],
    ...point,
    ...(kind === 'defender' && board.getDocument().surface.type === Basketball.surfaces.halfCourt ? { rotation: 180 } : {}),
    data: { number }
  })
});

/** Creates a complete localized basketball editor configuration. */
export function createBasketballEditor(locale: SportsBoardLocale = 'en', overrides: Partial<BasketballMessages> = {}): EditorSportDefinition {
  const messages = resolveBasketballMessages(locale, overrides);
  return {
    ...createBasketballViewer(locale, overrides),
    groups: [
      { id: 'attackers', label: messages.attackers, layout: 'grid' },
      { id: 'defenders', label: messages.defenders, layout: 'grid' },
      { id: 'objects', label: messages.equipment, layout: 'grid' },
      { id: 'movements', label: messages.movements, layout: 'list' }
    ],
    elements: [
      ...[1, 2, 3, 4, 5].map(number => numbered('attacker', number, messages)),
      ...[1, 2, 3, 4, 5].map(number => numbered('defender', number, messages)),
      { id: 'ball', type: Basketball.elements.ball, group: 'objects', label: messages.ball, icon: '', description: messages.ballDescription, create: point => ({ type: Basketball.elements.ball, ...point }) },
      { id: 'cone', type: Basketball.elements.cone, group: 'objects', label: messages.cone, icon: '△', description: messages.coneDescription, create: point => ({ type: Basketball.elements.cone, ...point }) },
      { id: 'ladder', type: Basketball.elements.ladder, group: 'objects', label: messages.ladder, icon: '▥', description: messages.ladderDescription, create: point => ({ type: Basketball.elements.ladder, ...point }) },
      { id: 'coach', type: Basketball.elements.coach, group: 'objects', label: messages.coach, icon: 'C', description: messages.coachDescription, create: point => ({ type: Basketball.elements.coach, ...point }) },
      { id: 'training-hoop', type: Basketball.elements.trainingHoop, group: 'objects', label: messages.trainingHoop, icon: '', description: messages.trainingHoopDescription, create: point => ({ type: Basketball.elements.trainingHoop, ...point }) },
      { id: 'basket', type: Basketball.elements.basket, group: 'objects', label: messages.basket, icon: '', description: messages.basketDescription, create: point => ({ type: Basketball.elements.basket, ...point }) }
    ],
    connectors: [
      { id: 'run', group: 'movements', label: messages.run, icon: '→', description: messages.runDescription, target: 'either', create: (from, target) => Basketball.run(from, target) },
      { id: 'dribble', group: 'movements', label: messages.dribble, icon: '〰', description: messages.dribbleDescription, target: 'either', create: (from, target) => Basketball.dribble(from, target) },
      { id: 'pass', group: 'movements', label: messages.pass, icon: '⇢', description: messages.passDescription, target: 'either', create: (from, target) => Basketball.pass(from, target) },
      { id: 'shot', group: 'movements', label: messages.shot, icon: '⊕', description: messages.shotDescription, target: 'either', create: (from, target) => Basketball.shot(from, target) },
      { id: 'screen', group: 'movements', label: messages.screen, icon: '⊣', description: messages.screenDescription, target: 'either', create: (from, target) => Basketball.screen(from, target) }
    ]
  };
}

export const BasketballEditor = createBasketballEditor();
