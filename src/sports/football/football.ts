import { connector, type EndpointInput, type ElementInput } from '../../core/index.js';

export const Football = {
  surfaces: { halfPitch: 'football.halfpitch', fullPitch: 'football.fullpitch' },
  elements: { player: 'football.player', ball: 'football.ball' },
  run: (from: EndpointInput, to: EndpointInput): ElementInput => connector(from, to, { color: '#2563eb', line: 'solid' }, 'run'),
  dribble: (from: EndpointInput, to: EndpointInput): ElementInput => connector(from, to, { color: '#0f172a', line: 'wavy' }, 'dribble'),
  pass: (from: EndpointInput, to: EndpointInput): ElementInput => connector(from, to, { color: '#111827', line: 'dashed' }, 'pass'),
  shot: (from: EndpointInput, to: EndpointInput): ElementInput => connector(from, to, { color: '#dc2626', line: 'shot', width: 4 }, 'shot')
} as const;
