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

export const CoreElements = Object.freeze({
  connector: 'core.connector',
  zone: 'core.zone',
  text: 'core.text',
  marker: 'core.marker',
  hurdle: 'core.hurdle',
  pole: 'core.pole'
});

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

const withMovementLabel = (
  node: Konva.Shape | Konva.Group,
  element: BoardElement,
  centerline: PixelPoint[],
  color: string
): Konva.Group => {
  const group = node instanceof Konva.Group ? node : new Konva.Group();
  if (group !== node) group.add(node);
  const value = typeof element.data?.label === 'string' ? element.data.label.trim() : '';
  if (!value || !centerline.length) return group;

  const point = centerline[Math.floor((centerline.length - 1) / 2)];
  const text = new Konva.Text({
    text: value.slice(0, 60),
    padding: 5,
    fill: color,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 12,
    fontStyle: 'bold',
    listening: false
  });
  const bounds = text.getClientRect({ skipTransform: true, skipShadow: true, skipStroke: true });
  const label = new Konva.Group({
    x: point.x - bounds.width / 2,
    y: point.y - bounds.height - 10,
    listening: false
  });
  label.add(new Konva.Rect({
    width: bounds.width,
    height: bounds.height,
    fill: '#ffffff',
    opacity: .92,
    cornerRadius: 6,
    shadowColor: '#0f172a',
    shadowBlur: 4,
    shadowOpacity: .16
  }));
  label.add(text);
  group.add(label);
  return group;
};

interface ElementBox { group: Konva.Group; width: number; height: number }

const elementBox = (
  element: BoardElement,
  context: RenderContext,
  defaultWidth: number,
  defaultHeight: number,
  aspectRatio: number | null = defaultHeight / defaultWidth,
  hitArea = true
): ElementBox => {
  const rawWidth = (element.width ?? defaultWidth) * context.width;
  const rawHeight = (element.height ?? defaultHeight) * context.height;
  const width = aspectRatio === null ? rawWidth : Math.sqrt(Math.max(1, rawWidth * rawHeight) / aspectRatio);
  const height = aspectRatio === null ? rawHeight : width * aspectRatio;
  const group = new Konva.Group({
    x: (element.x ?? 0) * context.width,
    y: (element.y ?? 0) * context.height,
    width,
    height,
    offsetX: width / 2,
    offsetY: height / 2,
    rotation: element.rotation ?? 0
  });
  if (hitArea) group.add(new Konva.Rect({ width, height, fill: 'rgba(0,0,0,.001)' }));
  return { group, width, height };
};

const elementColor = (element: BoardElement, fallback: string): string => String(element.style?.color ?? fallback);

const zone = (element: BoardElement, context: RenderContext): Konva.Group => {
  const { group, width, height } = elementBox(element, context, .24, .14, null, false);
  const color = elementColor(element, '#2563eb');
  group.add(new Konva.Rect({
    x: width * .02,
    y: height * .04,
    width: width * .96,
    height: height * .92,
    fill: color,
    opacity: .18,
    cornerRadius: Math.min(width, height) * .12,
    listening: false
  }));
  group.add(new Konva.Rect({
    x: width * .02,
    y: height * .04,
    width: width * .96,
    height: height * .92,
    stroke: color,
    strokeWidth: Math.max(2, Math.min(width, height) * .025),
    hitStrokeWidth: 16,
    dash: [10, 7],
    cornerRadius: Math.min(width, height) * .12
  }));
  return group;
};

const freeText = (element: BoardElement, context: RenderContext): Konva.Group => {
  const value = String(element.data?.text ?? 'Text').slice(0, 500);
  const width = (element.width ?? .32) * context.width;
  const baseHeight = (element.height ?? .11) * context.height;
  const padding = Math.max(9, width * .05);
  const fontSize = value.length > 320 ? 9 : value.length > 180 ? 10 : Math.max(10.5, Math.min(14, context.width * .018));
  const text = new Konva.Text({
    text: value,
    x: padding,
    width: width - padding * 2,
    align: 'center',
    verticalAlign: 'middle',
    fill: elementColor(element, '#0f172a'),
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize,
    fontStyle: 'bold',
    lineHeight: 1.2,
    wrap: 'word'
  });
  const contentHeight = text.height();
  // Keep one extra line of breathing room because Konva's wrapped text height
  // can land on a fractional boundary and otherwise clip the final line.
  const height = Math.min(context.height * .45, Math.max(baseHeight, contentHeight + padding * 2 + fontSize * 1.2));
  const group = new Konva.Group({
    x: (element.x ?? 0) * context.width,
    y: (element.y ?? 0) * context.height,
    width,
    height,
    offsetX: width / 2,
    offsetY: height / 2,
    rotation: element.rotation ?? 0
  });
  const color = elementColor(element, '#0f172a');
  group.add(new Konva.Rect({
    x: width * .02,
    y: height * .08,
    width: width * .96,
    height: height * .84,
    fill: '#ffffff',
    opacity: .88,
    cornerRadius: Math.min(width, height) * .18,
    stroke: color,
    strokeWidth: 1,
    shadowColor: '#0f172a',
    shadowBlur: 5,
    shadowOpacity: .12
  }));
  text.y(padding);
  text.height(height - padding * 2);
  text.ellipsis(contentHeight > height - padding * 2);
  group.add(text);
  return group;
};

const marker = (element: BoardElement, context: RenderContext): Konva.Group => {
  const { group, width, height } = elementBox(element, context, .058, .058, 1);
  const color = elementColor(element, '#7c3aed');
  const radius = Math.min(width, height) * .4;
  group.add(new Konva.Circle({
    x: width / 2,
    y: height / 2,
    radius,
    fill: '#ffffff',
    stroke: color,
    strokeWidth: Math.max(3, width * .065),
    shadowColor: '#0f172a',
    shadowBlur: 5,
    shadowOpacity: .2
  }));
  group.add(new Konva.Text({
    text: String(element.data?.text ?? 'A').slice(0, 3),
    x: width / 2 - radius,
    y: height / 2 - radius,
    width: radius * 2,
    height: radius * 2,
    align: 'center',
    verticalAlign: 'middle',
    fill: color,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: radius * .9,
    fontStyle: 'bold'
  }));
  return group;
};

const hurdle = (element: BoardElement, context: RenderContext): Konva.Group => {
  const { group, width, height } = elementBox(element, context, .05, .045, .62);
  const color = elementColor(element, '#f97316');
  const strokeWidth = Math.max(3, width * .07);
  const line = (points: number[], stroke = color, widthOverride = strokeWidth): void => {
    group.add(new Konva.Line({ points, stroke: '#ffffff', strokeWidth: widthOverride + 3, lineCap: 'round', lineJoin: 'round' }));
    group.add(new Konva.Line({ points, stroke, strokeWidth: widthOverride, lineCap: 'round', lineJoin: 'round' }));
  };
  line([width * .18, height * .82, width * .28, height * .25, width * .72, height * .25, width * .82, height * .82]);
  line([width * .1, height * .84, width * .34, height * .84]);
  line([width * .66, height * .84, width * .9, height * .84]);
  group.add(new Konva.Rect({ x: width * .23, y: height * .18, width: width * .54, height: strokeWidth * 1.7, cornerRadius: strokeWidth, fill: color, stroke: '#ffffff', strokeWidth: 1.5 }));
  return group;
};

const pole = (element: BoardElement, context: RenderContext): Konva.Group => {
  const { group, width, height } = elementBox(element, context, .032, .115, 3.4);
  const color = elementColor(element, '#f97316');
  const poleWidth = Math.max(5, width * .22);
  group.add(new Konva.Ellipse({ x: width / 2, y: height * .88, radiusX: width * .38, radiusY: height * .08, fill: '#0f172a', opacity: .18 }));
  group.add(new Konva.Line({ points: [width / 2, height * .12, width / 2, height * .83], stroke: '#ffffff', strokeWidth: poleWidth + 4, lineCap: 'round' }));
  group.add(new Konva.Line({ points: [width / 2, height * .12, width / 2, height * .83], stroke: color, strokeWidth: poleWidth, lineCap: 'round' }));
  for (const y of [.32, .54]) group.add(new Konva.Rect({ x: width / 2 - poleWidth / 2, y: height * y, width: poleWidth, height: height * .08, fill: '#ffffff', listening: false }));
  group.add(new Konva.Ellipse({ x: width / 2, y: height * .84, radiusX: width * .38, radiusY: height * .09, fill: color, stroke: '#ffffff', strokeWidth: 2 }));
  return group;
};

export function registerBuiltins(registry = new Registry()): Registry {
  registry.registerElement(CoreElements.connector, {
    transformable: false,
    connectable: false,
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
      if (line === 'screen') return withMovementLabel(screenShape(smoothPoints, color, width, 0, hitWidth), element, centerline, color);
      if (line === 'shot') return withMovementLabel(shotShape(smoothPoints, color, width, 0, hitWidth), element, centerline, color);
      const configuredAmplitude = Number(element.style?.waveAmplitude);
      const configuredWavelength = Number(element.style?.wavelength);
      const configuredArrowLead = Number(element.style?.arrowLead);
      return withMovementLabel(new Konva.Arrow({
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
      }), element, centerline, color);
    }
  });
  registry.registerElement(CoreElements.zone, {
    defaults: { width: .24, height: .14, style: { color: '#2563eb' } },
    layer: 'background',
    resize: { minWidth: .08, minHeight: .06, maxWidth: .9, maxHeight: .9, keepRatio: false },
    connectable: false,
    render: zone
  });
  registry.registerElement(CoreElements.text, { defaults: { width: .32, height: .11, style: { color: '#0f172a' }, data: { text: 'Text' } }, layer: 'annotations', connectable: false, render: freeText });
  registry.registerElement(CoreElements.marker, { defaults: { width: .058, height: .058, style: { color: '#7c3aed' }, data: { text: 'A' } }, connectable: false, render: marker });
  registry.registerElement(CoreElements.hurdle, { defaults: { width: .05, height: .045, style: { color: '#f97316' } }, connectable: false, render: hurdle });
  registry.registerElement(CoreElements.pole, { defaults: { width: .032, height: .115, style: { color: '#f97316' } }, connectable: false, render: pole });
  return registry;
}

export function isElementEndpoint(endpoint: Endpoint): endpoint is { element: string } { return 'element' in endpoint; }
