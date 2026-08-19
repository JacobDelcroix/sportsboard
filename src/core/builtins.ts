import Konva from 'konva';
import { Registry } from './registry.js';
import type { BoardElement, Endpoint, RenderContext } from './types.js';

const routePoints = (element: BoardElement, context: RenderContext): number[] => {
  const fromEndpoint = element.from ?? { x: element.x ?? 0, y: element.y ?? 0 };
  const toEndpoint = element.to ?? fromEndpoint;
  const fromCenter = context.resolveEndpoint(fromEndpoint);
  const toCenter = context.resolveEndpoint(toEndpoint);
  const waypoints = element.waypoints ?? [];
  const configuredGap = Number(element.style?.gap);
  const gap = Number.isFinite(configuredGap) ? Math.max(0, configuredGap) : undefined;
  const from = context.resolveEndpoint(fromEndpoint, waypoints[0] ?? toCenter, gap);
  const to = context.resolveEndpoint(toEndpoint, waypoints.at(-1) ?? fromCenter, gap);
  return [from, ...waypoints, to].flatMap(point => [point.x * context.width, point.y * context.height]);
};

interface PixelPoint { x: number; y: number }

const pointDistance = (from: PixelPoint, to: PixelPoint): number => Math.hypot(to.x - from.x, to.y - from.y);
const interpolate = (from: PixelPoint, to: PixelPoint, progress: number): PixelPoint => ({
  x: from.x + (to.x - from.x) * progress,
  y: from.y + (to.y - from.y) * progress
});

const pixelPoints = (points: number[]): PixelPoint[] => {
  const result: PixelPoint[] = [];
  for (let index = 0; index < points.length; index += 2) result.push({ x: points[index], y: points[index + 1] });
  return result;
};

const resampleRoute = (points: PixelPoint[], interval = 2): PixelPoint[] => {
  if (points.length < 2) return points;
  const distances = [0];
  for (let index = 1; index < points.length; index += 1) distances[index] = distances[index - 1] + pointDistance(points[index - 1], points[index]);
  const total = distances.at(-1) ?? 0;
  if (total < .01) return [points[0], points.at(-1)!];
  const result = [points[0]];
  let segment = 1;
  for (let distance = interval; distance < total; distance += interval) {
    while (segment < distances.length - 1 && distances[segment] < distance) segment += 1;
    const fromDistance = distances[segment - 1];
    const segmentLength = distances[segment] - fromDistance;
    result.push(interpolate(points[segment - 1], points[segment], segmentLength ? (distance - fromDistance) / segmentLength : 0));
  }
  result.push(points.at(-1)!);
  return result;
};

/**
 * Rounds every direction change without the overshoot produced by a
 * Catmull-Rom spline when two handles are close together. The radius is always
 * bounded by its adjacent segments, so the route cannot loop or move back
 * behind a handle.
 */
const smoothRoute = (route: number[], tension: number): PixelPoint[] => {
  const controls = pixelPoints(route);
  if (controls.length < 2) return controls;
  if (controls.length < 3 || tension <= 0) return resampleRoute(controls);
  const path: PixelPoint[] = [controls[0]];
  for (let index = 1; index < controls.length - 1; index += 1) {
    const previous = controls[index - 1];
    const corner = controls[index];
    const next = controls[index + 1];
    const incoming = pointDistance(previous, corner);
    const outgoing = pointDistance(corner, next);
    if (incoming < .5 || outgoing < .5) {
      path.push(corner);
      continue;
    }
    const radius = Math.min(incoming * .44, outgoing * .44, 72 * tension);
    const entry = {
      x: corner.x - (corner.x - previous.x) / incoming * radius,
      y: corner.y - (corner.y - previous.y) / incoming * radius
    };
    const exit = {
      x: corner.x + (next.x - corner.x) / outgoing * radius,
      y: corner.y + (next.y - corner.y) / outgoing * radius
    };
    path.push(entry);
    const curveSteps = Math.max(4, Math.ceil((pointDistance(entry, corner) + pointDistance(corner, exit)) / 4));
    for (let step = 1; step <= curveSteps; step += 1) {
      const progress = step / curveSteps;
      const inverse = 1 - progress;
      path.push({
        x: inverse * inverse * entry.x + 2 * inverse * progress * corner.x + progress * progress * exit.x,
        y: inverse * inverse * entry.y + 2 * inverse * progress * corner.y + progress * progress * exit.y
      });
    }
  }
  path.push(controls.at(-1)!);
  return resampleRoute(path);
};

const wavyPoints = (centerline: PixelPoint[], amplitude = 4.25, wavelength = 24, arrowLead = 18): number[] => {
  const distances = [0];
  for (let index = 1; index < centerline.length; index += 1) {
    distances[index] = distances[index - 1] + pointDistance(centerline[index - 1], centerline[index]);
  }
  const total = distances.at(-1) ?? 0;
  return centerline.flatMap((point, index) => {
    const probe = Math.max(2, Math.ceil(wavelength / 8));
    const previous = centerline[Math.max(0, index - probe)];
    const next = centerline[Math.min(centerline.length - 1, index + probe)];
    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    const length = Math.hypot(dx, dy) || 1;
    const remaining = total - distances[index];
    const fade = Math.max(0, Math.min(1, distances[index] / wavelength, (remaining - arrowLead) / wavelength));
    const envelope = fade * fade * (3 - 2 * fade);
    const incomingLength = pointDistance(previous, point) || 1;
    const outgoingLength = pointDistance(point, next) || 1;
    const dot = Math.max(-1, Math.min(1,
      ((point.x - previous.x) / incomingLength) * ((next.x - point.x) / outgoingLength)
      + ((point.y - previous.y) / incomingLength) * ((next.y - point.y) / outgoingLength)
    ));
    const turn = Math.acos(dot);
    const bendScale = Math.max(.38, 1 - Math.max(0, turn - .12) / 1.25 * .62);
    const offset = Math.sin(distances[index] / wavelength * Math.PI * 2) * amplitude * Math.max(0, envelope) * bendScale;
    return [point.x - dy / length * offset, point.y + dx / length * offset];
  });
};

const screenShape = (points: number[], color: string, width: number, tension: number, hitWidth: number): Konva.Group => {
  const [x1, y1, x2, y2] = points.slice(-4);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const cap = 10;
  const nx = Math.cos(angle + Math.PI / 2) * cap;
  const ny = Math.sin(angle + Math.PI / 2) * cap;
  const group = new Konva.Group();
  const capPoints = [x2 - nx, y2 - ny, x2 + nx, y2 + ny];
  group.add(new Konva.Line({ points, stroke: '#ffffff', strokeWidth: width + 5, opacity: .88, lineCap: 'round', lineJoin: 'round', tension }));
  group.add(new Konva.Line({ points, stroke: color, strokeWidth: width, hitStrokeWidth: hitWidth, lineCap: 'round', lineJoin: 'round', tension }));
  group.add(new Konva.Line({ points: capPoints, stroke: '#ffffff', strokeWidth: width + 5, opacity: .88, lineCap: 'round' }));
  group.add(new Konva.Line({ points: capPoints, stroke: color, strokeWidth: width, hitStrokeWidth: hitWidth, lineCap: 'round' }));
  return group;
};

const shotShape = (points: number[], color: string, width: number, tension: number, hitWidth: number): Konva.Group => {
  const group = new Konva.Group();
  const arrow = (stroke: string, strokeWidth: number): Konva.Arrow => new Konva.Arrow({
    points,
    stroke,
    fill: stroke,
    strokeWidth,
    hitStrokeWidth: hitWidth,
    pointerLength: 13,
    pointerWidth: 11,
    tension,
    lineCap: 'round',
    lineJoin: 'round'
  });
  group.add(arrow('#ffffff', width + 4));
  group.add(arrow(color, width));
  const [x1, y1, x2, y2] = points.slice(-4);
  const length = Math.hypot(x2 - x1, y2 - y1) || 1;
  const marker = { x: x2 - (x2 - x1) / length * 19, y: y2 - (y2 - y1) / length * 19 };
  group.add(new Konva.Circle({ ...marker, radius: 7, fill: '#ffffff', stroke: color, strokeWidth: 2.5 }));
  group.add(new Konva.Circle({ ...marker, radius: 2.4, fill: color }));
  return group;
};

export function registerBuiltins(registry = new Registry()): Registry {
  registry.registerElement('core.connector', {
    transformable: false,
    layer: 'connectors',
    render: (element, context) => {
      const points = routePoints(element, context);
      const color = String(element.style?.color ?? '#2563eb');
      const width = Number(element.style?.width ?? 4);
      const line = String(element.style?.line ?? 'solid');
      const configuredHitWidth = Number(element.style?.hitWidth);
      const hitWidth = Number.isFinite(configuredHitWidth) ? Math.max(width, configuredHitWidth) : Math.max(22, width + 12);
      const configuredTension = Number(element.style?.tension);
      const tension = Number.isFinite(configuredTension) ? Math.max(0, Math.min(1, configuredTension)) : element.waypoints?.length ? .5 : 0;
      const centerline = smoothRoute(points, tension);
      const smoothPoints = centerline.flatMap(point => [point.x, point.y]);
      if (line === 'screen') return screenShape(smoothPoints, color, width, 0, hitWidth);
      if (line === 'shot') return shotShape(smoothPoints, color, width, 0, hitWidth);
      const configuredAmplitude = Number(element.style?.waveAmplitude);
      const configuredWavelength = Number(element.style?.wavelength);
      const configuredArrowLead = Number(element.style?.arrowLead);
      return new Konva.Arrow({
        points: line === 'wavy' ? wavyPoints(
          centerline,
          Number.isFinite(configuredAmplitude) ? Math.max(0, configuredAmplitude) : 4.25,
          Number.isFinite(configuredWavelength) ? Math.max(4, configuredWavelength) : 24,
          Number.isFinite(configuredArrowLead) ? Math.max(12, configuredArrowLead) : 18
        ) : smoothPoints,
        stroke: color,
        fill: color,
        strokeWidth: width,
        hitStrokeWidth: hitWidth,
        dash: line === 'dashed' ? [12, 8] : undefined,
        pointerLength: 12,
        pointerWidth: 10,
        tension: 0,
        lineCap: 'round',
        lineJoin: 'round'
      });
    }
  });
  return registry;
}

export function isElementEndpoint(endpoint: Endpoint): endpoint is { element: string } { return 'element' in endpoint; }
