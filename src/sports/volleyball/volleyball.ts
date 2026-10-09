import { connector, type EndpointInput, type ElementInput } from '../../core/index.js';

export const Volleyball = {
  surfaces: { halfCourt: 'volleyball.halfcourt', fullCourt: 'volleyball.fullcourt' },
  elements: {
    attacker: 'volleyball.attacker',
    defender: 'volleyball.defender',
    coach: 'volleyball.coach',
    ball: 'volleyball.ball',
    cone: 'volleyball.cone'
  },
  run: (from: EndpointInput, to: EndpointInput): ElementInput => connector(from, to, { color: '#2563eb', line: 'solid' }, 'run'),
  pass: (from: EndpointInput, to: EndpointInput): ElementInput => connector(from, to, { color: '#111827', line: 'dashed' }, 'pass'),
  set: (from: EndpointInput, to: EndpointInput): ElementInput => connector(from, to, { color: '#0f172a', line: 'wavy' }, 'set'),
  spike: (from: EndpointInput, to: EndpointInput): ElementInput => connector(from, to, { color: '#dc2626', line: 'shot', width: 4 }, 'spike'),
  block: (from: EndpointInput, to: EndpointInput): ElementInput => connector(from, to, { color: '#111827', line: 'screen', width: 5 }, 'block')
} as const;