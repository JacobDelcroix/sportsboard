import { connector, type EndpointInput, type ElementInput } from '../../core/index.js';

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
