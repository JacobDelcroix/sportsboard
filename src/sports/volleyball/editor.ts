import type { Point } from '../../core/index.js';
import type { EditorSportDefinition } from '../../editor/index.js';
import type { SportsBoardLocale } from '../../viewer/index.js';
import { Volleyball } from './volleyball.js';
import { resolveVolleyballMessages, type VolleyballMessages } from './i18n.js';
import { createVolleyballViewer } from './viewer.js';

const numbered = (kind: 'attacker' | 'defender', number: number, messages: VolleyballMessages) => ({
  id: `${kind}-${number}`,
  type: Volleyball.elements[kind],
  group: kind === 'attacker' ? 'attackers' : 'defenders',
  label: String(number),
  icon: String(number),
  description: (kind === 'attacker' ? messages.attackerDescription : messages.defenderDescription).replace('{number}', String(number)),
  create: (point: Point) => ({ type: Volleyball.elements[kind], ...point, data: { number } })
});

/** Creates a complete localized volleyball editor configuration. */
export function createVolleyballEditor(locale: SportsBoardLocale = 'en', overrides: Partial<VolleyballMessages> = {}): EditorSportDefinition {
  const messages = resolveVolleyballMessages(locale, overrides);
  return {
    ...createVolleyballViewer(locale, overrides),
    groups: [
      { id: 'attackers', label: messages.attackers, layout: 'grid' },
      { id: 'defenders', label: messages.defenders, layout: 'grid' },
      { id: 'equipment', label: messages.equipment, layout: 'grid' },
      { id: 'movements', label: messages.movements, layout: 'list' }
    ],
    elements: [
      ...Array.from({ length: 6 }, (_, index) => numbered('attacker', index + 1, messages)),
      ...Array.from({ length: 6 }, (_, index) => numbered('defender', index + 1, messages)),
      { id: 'ball', type: Volleyball.elements.ball, group: 'equipment', label: messages.ball, icon: '', description: messages.ballDescription, create: point => ({ type: Volleyball.elements.ball, ...point }) },
      { id: 'coach', type: Volleyball.elements.coach, group: 'equipment', label: messages.coach, icon: 'C', description: messages.coachDescription, create: point => ({ type: Volleyball.elements.coach, ...point }) },
      { id: 'cone', type: Volleyball.elements.cone, group: 'equipment', label: messages.cone, icon: '△', description: messages.coneDescription, create: point => ({ type: Volleyball.elements.cone, ...point }) }
    ],
    connectors: [
      { id: 'run', group: 'movements', label: messages.run, icon: '→', description: messages.runDescription, target: 'either', create: (from, target) => Volleyball.run(from, target) },
      { id: 'pass', group: 'movements', label: messages.pass, icon: '⇢', description: messages.passDescription, target: 'either', create: (from, target) => Volleyball.pass(from, target) },
      { id: 'set', group: 'movements', label: messages.set, icon: '〰', description: messages.setDescription, target: 'either', create: (from, target) => Volleyball.set(from, target) },
      { id: 'spike', group: 'movements', label: messages.spike, icon: '⊕', description: messages.spikeDescription, target: 'either', create: (from, target) => Volleyball.spike(from, target) },
      { id: 'block', group: 'movements', label: messages.block, icon: '⊣', description: messages.blockDescription, target: 'either', create: (from, target) => Volleyball.block(from, target) }
    ]
  };
}

export const VolleyballEditor = createVolleyballEditor();