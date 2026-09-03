import Konva from 'konva';
import type { BoardElement, Registry, RenderContext } from '../../core/index.js';

interface ElementBox {
  group: Konva.Group;
  width: number;
  height: number;
}

const elementBox = (
  element: BoardElement,
  context: RenderContext,
  defaultWidth: number,
  defaultHeight: number,
  aspectRatio = 1
): ElementBox => {
  const rawWidth = (element.width ?? defaultWidth) * context.width;
  const rawHeight = (element.height ?? defaultHeight) * context.height;
  const width = Math.sqrt(Math.max(1, rawWidth * rawHeight) / aspectRatio);
  const height = width * aspectRatio;
  const group = new Konva.Group({
    x: (element.x ?? 0) * context.width,
    y: (element.y ?? 0) * context.height,
    width,
    height,
    offsetX: width / 2,
    offsetY: height / 2,
    rotation: element.rotation ?? 0
  });
  group.add(new Konva.Rect({ width, height, fill: 'rgba(0,0,0,.001)' }));
  return { group, width, height };
};

const player = (defense: boolean) => (element: BoardElement, context: RenderContext): Konva.Group => {
  const { group, width, height } = elementBox(element, context, .07, .07);
  const center = { x: width / 2, y: height / 2 };
  const color = String(element.style?.color ?? (defense ? '#dc2626' : '#2563eb'));
  const radius = Math.min(width, height) * (defense ? .34 : .43);

  if (defense) {
    const armWidth = Math.max(3, width * .075);
    const addArm = (points: number[]): void => {
      group.add(new Konva.Line({ points, stroke: 'rgba(255,255,255,.9)', strokeWidth: armWidth + 2, lineCap: 'round', lineJoin: 'round', bezier: true }));
      group.add(new Konva.Line({ points, stroke: color, strokeWidth: armWidth, lineCap: 'round', lineJoin: 'round', bezier: true }));
    };
    addArm([center.x - radius * .72, center.y - radius * .18, width * .18, height * .34, width * .08, height * .22, width * .04, height * .05]);
    addArm([center.x + radius * .72, center.y - radius * .18, width * .82, height * .34, width * .92, height * .22, width * .96, height * .05]);
  }

  group.add(new Konva.Circle({
    ...center,
    radius,
    fill: color,
    stroke: '#ffffff',
    strokeWidth: Math.max(2, width * .055),
    shadowColor: '#0f172a',
    shadowBlur: Math.max(4, width * .18),
    shadowOffset: { x: 0, y: Math.max(2, width * .06) },
    shadowOpacity: .28
  }));
  group.add(new Konva.Circle({ ...center, radius: radius * .78, stroke: 'rgba(255,255,255,.22)', strokeWidth: Math.max(1, width * .025) }));
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

const coach = (element: BoardElement, context: RenderContext): Konva.Group => {
  const { group, width, height } = elementBox(element, context, .07, .07);
  const center = { x: width / 2, y: height / 2 };
  const radius = Math.min(width, height) * .42;
  const color = String(element.style?.color ?? '#0f172a');
  group.add(new Konva.Circle({
    ...center,
    radius,
    fill: color,
    stroke: '#fbbf24',
    strokeWidth: Math.max(3, width * .065),
    shadowColor: '#0f172a',
    shadowBlur: Math.max(4, width * .18),
    shadowOffset: { x: 0, y: Math.max(2, width * .06) },
    shadowOpacity: .3
  }));
  group.add(new Konva.Text({
    name: 'sportsboard-upright',
    text: 'C',
    x: center.x,
    y: center.y,
    width: radius * 2,
    height: radius * 2,
    offsetX: radius,
    offsetY: radius,
    align: 'center',
    verticalAlign: 'middle',
    fill: '#fef3c7',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontStyle: 'bold',
    fontSize: radius
  }));
  return group;
};

const mixHex = (source: string, target: string, amount: number): string => {
  const expand = (value: string): string => value.length === 4 ? `#${value.slice(1).split('').map(character => character + character).join('')}` : value;
  const from = expand(source);
  const to = expand(target);
  if (!/^#[0-9a-f]{6}$/i.test(from) || !/^#[0-9a-f]{6}$/i.test(to)) return source;
  const channel = (value: string, index: number): number => Number.parseInt(value.slice(index, index + 2), 16);
  const mixed = [1, 3, 5].map(index => Math.round(channel(from, index) + (channel(to, index) - channel(from, index)) * amount));
  return `#${mixed.map(value => value.toString(16).padStart(2, '0')).join('')}`;
};

const ball = (element: BoardElement, context: RenderContext): Konva.Group => {
  const { group, width, height } = elementBox(element, context, .042, .042);
  const radius = Math.min(width, height) * .43;
  const center = { x: width / 2, y: height / 2 };
  const color = String(element.style?.color ?? '#f97316');
  const light = mixHex(color, '#fff7ed', .62);
  const warm = mixHex(color, '#fb923c', .3);
  const shade = mixHex(color, '#7c2d12', .58);
  const seam = mixHex(color, '#1c0a04', .82);
  const seamWidth = Math.max(1.6, width * .04);

  group.add(new Konva.Ellipse({
    x: center.x,
    y: center.y + radius * .87,
    radiusX: radius * .72,
    radiusY: radius * .18,
    fill: '#1c1917',
    opacity: .22,
    blurRadius: 2
  }));
  group.add(new Konva.Circle({
    ...center,
    radius,
    fillRadialGradientStartPoint: { x: center.x - radius * .35, y: center.y - radius * .4 },
    fillRadialGradientStartRadius: 0,
    fillRadialGradientEndPoint: { x: center.x + radius * .22, y: center.y + radius * .28 },
    fillRadialGradientEndRadius: radius * 1.2,
    fillRadialGradientColorStops: [0, light, .28, warm, .68, color, 1, shade],
    stroke: seam,
    strokeWidth: seamWidth,
    shadowColor: '#0f172a',
    shadowBlur: Math.max(4, width * .15),
    shadowOffset: { x: 0, y: Math.max(2, width * .055) },
    shadowOpacity: .28
  }));

  const seams = new Konva.Group({
    clipFunc(canvasContext) {
      canvasContext.arc(center.x, center.y, radius - seamWidth * .35, 0, Math.PI * 2);
    }
  });
  const path = (data: string): Konva.Path => new Konva.Path({
    data,
    stroke: seam,
    strokeWidth: seamWidth,
    lineCap: 'round',
    lineJoin: 'round'
  });
  seams.add(path(`M ${center.x - radius} ${center.y - radius * .05} Q ${center.x} ${center.y + radius * .17} ${center.x + radius} ${center.y - radius * .05}`));
  seams.add(path(`M ${center.x - radius * .14} ${center.y - radius} C ${center.x - radius * .5} ${center.y - radius * .38}, ${center.x - radius * .48} ${center.y + radius * .42}, ${center.x - radius * .08} ${center.y + radius}`));
  seams.add(path(`M ${center.x - radius * .78} ${center.y - radius * .66} C ${center.x - radius * .2} ${center.y - radius * .34}, ${center.x + radius * .28} ${center.y - radius * .45}, ${center.x + radius * .78} ${center.y - radius * .66}`));
  seams.add(path(`M ${center.x - radius * .72} ${center.y + radius * .72} C ${center.x - radius * .14} ${center.y + radius * .42}, ${center.x + radius * .34} ${center.y + radius * .45}, ${center.x + radius * .76} ${center.y + radius * .68}`));
  group.add(seams);

  group.add(new Konva.Ellipse({
    x: center.x - radius * .3,
    y: center.y - radius * .38,
    radiusX: radius * .22,
    radiusY: radius * .11,
    rotation: -35,
    fill: '#ffffff',
    opacity: .28
  }));
  group.add(new Konva.Circle({ ...center, radius: radius * .91, stroke: light, strokeWidth: Math.max(1, width * .018), opacity: .22 }));
  return group;
};

const cone = (element: BoardElement, context: RenderContext): Konva.Group => {
  const { group, width, height } = elementBox(element, context, .04, .052, 1.12);
  const color = String(element.style?.color ?? '#f97316');
  group.add(new Konva.Rect({ x: width * .08, y: height * .8, width: width * .84, height: height * .13, cornerRadius: height * .05, fill: '#9a3412', shadowColor: '#0f172a', shadowBlur: 5, shadowOffset: { x: 0, y: 2 }, shadowOpacity: .25 }));
  group.add(new Konva.Line({
    points: [width * .5, height * .06, width * .78, height * .82, width * .22, height * .82],
    closed: true,
    fill: color,
    stroke: '#fff7ed',
    strokeWidth: Math.max(1.5, width * .045),
    lineJoin: 'round'
  }));
  group.add(new Konva.Line({ points: [width * .3, height * .58, width * .7, height * .58, width * .74, height * .69, width * .26, height * .69], closed: true, fill: '#fff7ed', opacity: .9 }));
  return group;
};

const ladder = (element: BoardElement, context: RenderContext): Konva.Group => {
  const { group, width, height } = elementBox(element, context, .07, .15, 2);
  const color = String(element.style?.color ?? '#facc15');
  const railWidth = Math.max(3, width * .1);
  group.add(new Konva.Rect({ x: width * .12, y: height * .04, width: width * .76, height: height * .92, cornerRadius: width * .16, fill: 'rgba(15,23,42,.12)', shadowColor: '#0f172a', shadowBlur: 6, shadowOffset: { x: 0, y: 3 }, shadowOpacity: .22 }));
  group.add(new Konva.Line({ points: [width * .22, height * .04, width * .22, height * .96], stroke: color, strokeWidth: railWidth, lineCap: 'round' }));
  group.add(new Konva.Line({ points: [width * .78, height * .04, width * .78, height * .96], stroke: color, strokeWidth: railWidth, lineCap: 'round' }));
  for (let index = 1; index < 6; index++) {
    const rungY = height * index / 6;
    group.add(new Konva.Line({ points: [width * .22, rungY, width * .78, rungY], stroke: '#fef9c3', strokeWidth: Math.max(2, railWidth * .68), lineCap: 'round' }));
  }
  return group;
};

const trainingHoop = (element: BoardElement, context: RenderContext): Konva.Group => {
  const { group, width, height } = elementBox(element, context, .05, .05);
  const center = { x: width / 2, y: height / 2 };
  const radius = Math.min(width, height) * .34;
  const color = String(element.style?.color ?? '#f97316');
  const strokeWidth = Math.max(3, width * .09);

  group.add(new Konva.Circle({
    ...center,
    radius,
    stroke: '#ffffff',
    strokeWidth: strokeWidth + 3,
    shadowColor: '#0f172a',
    shadowBlur: Math.max(3, width * .12),
    shadowOffset: { x: 0, y: Math.max(1, width * .035) },
    shadowOpacity: .22
  }));
  group.add(new Konva.Circle({ ...center, radius, stroke: color, strokeWidth }));
  return group;
};

const basket = (element: BoardElement, context: RenderContext): Konva.Group => {
  const { group, width, height } = elementBox(element, context, .17, .09, .45);
  const backboardColor = String(element.style?.color ?? '#475569');
  const rimColor = '#f97316';
  const boardHeight = Math.max(4, height * .18);
  const rimRadius = Math.min(width * .16, height * .27);
  const rimCenter = { x: width / 2, y: height * .53 };

  group.add(new Konva.Rect({
    x: width * .08,
    y: height * .2,
    width: width * .84,
    height: boardHeight,
    cornerRadius: boardHeight / 2,
    fill: backboardColor,
    stroke: '#ffffff',
    strokeWidth: Math.max(1.5, height * .06),
    shadowColor: '#0f172a',
    shadowBlur: Math.max(4, height * .18),
    shadowOffset: { x: 0, y: Math.max(2, height * .08) },
    shadowOpacity: .25
  }));
  group.add(new Konva.Line({
    points: [width / 2, height * .2 + boardHeight, rimCenter.x, rimCenter.y - rimRadius],
    stroke: rimColor,
    strokeWidth: Math.max(2.5, height * .09),
    lineCap: 'round'
  }));
  group.add(new Konva.Circle({
    ...rimCenter,
    radius: rimRadius,
    stroke: '#ffffff',
    strokeWidth: Math.max(4, height * .14)
  }));
  group.add(new Konva.Circle({
    ...rimCenter,
    radius: rimRadius,
    stroke: rimColor,
    strokeWidth: Math.max(2.5, height * .09)
  }));
  return group;
};

export function registerBasketballElements(registry: Registry): void {
  registry.registerElement('basketball.attacker', { defaults: { width: .07, height: .07, data: { number: 1 } }, connectionBoundary: { shape: 'ellipse', margin: .008 }, render: player(false) });
  registry.registerElement('basketball.defender', { defaults: { width: .07, height: .07, data: { number: 1 } }, connectionBoundary: { shape: 'ellipse', margin: .008 }, render: player(true) });
  registry.registerElement('basketball.coach', {
    defaults: { width: .07, height: .07 },
    connectable: true,
    connectionBoundary: { shape: 'ellipse', margin: .008 },
    render: coach
  });
  registry.registerElement('basketball.ball', {
    defaults: { width: .042, height: .042 },
    connectable: false,
    connectionBoundary: { shape: 'ellipse', margin: .006 },
    magnet: {
      targetTypes: ['basketball.attacker', 'basketball.defender', 'basketball.coach'],
      threshold: .075,
      anchors: [{ x: .06, y: .28 }, { x: .94, y: .28 }]
    },
    render: ball
  });
  registry.registerElement('basketball.cone', { defaults: { width: .04, height: .052 }, connectionBoundary: { shape: 'rectangle', margin: .005 }, render: cone });
  registry.registerElement('basketball.ladder', { defaults: { width: .07, height: .15 }, connectionBoundary: { shape: 'rectangle', margin: .006 }, render: ladder });
  registry.registerElement('basketball.training-hoop', { defaults: { width: .05, height: .05, style: { color: '#f97316' } }, connectable: false, render: trainingHoop });
  registry.registerElement('basketball.basket', { defaults: { width: .14, height: .075, style: { color: '#475569' } }, connectable: false, render: basket });
}
