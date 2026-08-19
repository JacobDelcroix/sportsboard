import type { BoardElement, ElementInput, Endpoint } from '../../core/index.js';

type EndpointInput = BoardElement | string | Endpoint;
const endpoint = (value: EndpointInput): Endpoint => typeof value === 'string' ? { element: value } : 'id' in value ? { element: value.id } : value;
const connector = (from: EndpointInput, to: EndpointInput, style: Record<string, unknown>, movement: string): ElementInput => ({ type: 'core.connector', from: endpoint(from), to: endpoint(to), style, data: { movement } });

export const Basketball = {
  surfaces: { halfCourt: 'basketball.halfcourt', fullCourt: 'basketball.fullcourt' },
  elements: {
    attacker: 'basketball.attacker',
    defender: 'basketball.defender',
    coach: 'basketball.coach',
    ball: 'basketball.ball',
    cone: 'basketball.cone',
    ladder: 'basketball.ladder',
    trainingHoop: 'basketball.training-hoop',
    basket: 'basketball.basket'
  },
  run: (from: EndpointInput, to: EndpointInput): ElementInput => connector(from, to, { color: '#2563eb', line: 'solid' }, 'run'),
  dribble: (from: EndpointInput, to: EndpointInput): ElementInput => connector(from, to, { color: '#0f172a', line: 'wavy' }, 'dribble'),
  pass: (from: EndpointInput, to: EndpointInput): ElementInput => connector(from, to, { color: '#111827', line: 'dashed' }, 'pass'),
  shot: (from: EndpointInput, to: EndpointInput = { x: .5, y: .08 }): ElementInput => connector(from, to, { color: '#dc2626', line: 'shot', width: 4 }, 'shot'),
  screen: (from: EndpointInput, to: EndpointInput): ElementInput => connector(from, to, { color: '#111827', line: 'screen', width: 5 }, 'screen')
} as const;
