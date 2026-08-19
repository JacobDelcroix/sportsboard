import Konva from 'konva';
import type { BoardElement, Registry, RenderContext } from '../../core/index.js';

interface ElementBox { group: Konva.Group; width: number; height: number }

const elementBox = (element: BoardElement, context: RenderContext, defaultWidth: number, defaultHeight: number): ElementBox => {
  const rawWidth = (element.width ?? defaultWidth) * context.width;
  const rawHeight = (element.height ?? defaultHeight) * context.height;
  const size = Math.sqrt(Math.max(1, rawWidth * rawHeight));
  const group = new Konva.Group({
    x: (element.x ?? 0) * context.width,
    y: (element.y ?? 0) * context.height,
    width: size,
    height: size,
    offsetX: size / 2,
    offsetY: size / 2,
    rotation: element.rotation ?? 0
  });
  group.add(new Konva.Rect({ width: size, height: size, fill: 'rgba(0,0,0,.001)' }));
  return { group, width: size, height: size };
};

const player = (element: BoardElement, context: RenderContext): Konva.Group => {
  const { group, width, height } = elementBox(element, context, .064, .064);
  const center = { x: width / 2, y: height / 2 };
  const radius = Math.min(width, height) * .41;
  const color = String(element.style?.color ?? '#2563eb');

  group.add(new Konva.RegularPolygon({
    x: center.x,
    y: center.y - radius * 1.02,
    sides: 3,
    radius: radius * .24,
    rotation: 0,
    fill: color,
    stroke: '#ffffff',
    strokeWidth: Math.max(1.5, width * .04)
  }));
  group.add(new Konva.Circle({
    ...center,
    radius,
    fill: color,
    stroke: '#ffffff',
    strokeWidth: Math.max(2, width * .055),
    shadowColor: '#052e16',
    shadowBlur: Math.max(4, width * .18),
    shadowOffset: { x: 0, y: Math.max(2, width * .06) },
    shadowOpacity: .3
  }));
  group.add(new Konva.Circle({ ...center, radius: radius * .76, stroke: 'rgba(255,255,255,.24)', strokeWidth: Math.max(1, width * .025) }));
  group.add(new Konva.Text({
    name: 'sportsboard-upright',
    text: String(element.data?.number ?? 1),
    x: center.x,
    y: center.y,
    width: radius * 2,
    height: radius * 2,
    offsetX: radius,
    offsetY: radius,
    align: 'center',
    verticalAlign: 'middle',
    fill: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontStyle: 'bold',
    fontSize: radius * .9
  }));
  return group;
};

const ball = (element: BoardElement, context: RenderContext): Konva.Group => {
  const { group, width, height } = elementBox(element, context, .036, .036);
  const center = { x: width / 2, y: height / 2 };
  const radius = Math.min(width, height) * .42;
  const seam = '#111827';
  const white = String(element.style?.color ?? '#f8fafc');

  group.add(new Konva.Ellipse({
    x: center.x,
    y: center.y + radius * .9,
    radiusX: radius * .7,
    radiusY: radius * .17,
    fill: '#052e16',
    opacity: .25
  }));
  group.add(new Konva.Circle({
    ...center,
    radius,
    fillRadialGradientStartPoint: { x: center.x - radius * .3, y: center.y - radius * .35 },
    fillRadialGradientStartRadius: 0,
    fillRadialGradientEndPoint: { x: center.x + radius * .2, y: center.y + radius * .25 },
    fillRadialGradientEndRadius: radius * 1.25,
    fillRadialGradientColorStops: [0, '#ffffff', .62, white, 1, '#cbd5e1'],
    stroke: '#0f172a',
    strokeWidth: Math.max(1.2, width * .035),
    shadowColor: '#052e16',
    shadowBlur: Math.max(3, width * .14),
    shadowOffset: { x: 0, y: Math.max(1.5, width * .05) },
    shadowOpacity: .3
  }));

  const centerPatchRadius = radius * .3;
  group.add(new Konva.RegularPolygon({ ...center, sides: 5, radius: centerPatchRadius, rotation: -18, fill: seam }));
  for (let index = 0; index < 5; index += 1) {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / 5;
    const patch = {
      x: center.x + Math.cos(angle) * radius * .7,
      y: center.y + Math.sin(angle) * radius * .7
    };
    group.add(new Konva.Line({
      points: [
        center.x + Math.cos(angle) * centerPatchRadius * .8,
        center.y + Math.sin(angle) * centerPatchRadius * .8,
        patch.x,
        patch.y
      ],
      stroke: seam,
      strokeWidth: Math.max(1, width * .025),
      lineCap: 'round'
    }));
    group.add(new Konva.RegularPolygon({ ...patch, sides: 5, radius: radius * .17, rotation: angle * 180 / Math.PI, fill: seam }));
  }
  group.add(new Konva.Ellipse({ x: center.x - radius * .3, y: center.y - radius * .4, radiusX: radius * .2, radiusY: radius * .09, rotation: -35, fill: '#ffffff', opacity: .5 }));
  return group;
};

export function registerFootballElements(registry: Registry): void {
  registry.registerElement('football.player', {
    defaults: { width: .064, height: .064, data: { number: 1 } },
    connectionBoundary: { shape: 'ellipse', margin: .008 },
    render: player
  });
  registry.registerElement('football.ball', {
    defaults: { width: .036, height: .036, style: { color: '#f8fafc' } },
    connectable: false,
    connectionBoundary: { shape: 'ellipse', margin: .005 },
    magnet: {
      targetTypes: ['football.player'],
      threshold: .075,
      anchors: [{ x: .06, y: .3 }, { x: .94, y: .3 }]
    },
    render: ball
  });
}
