import Konva from 'konva';
import { elementBox, elementColor, type BoardElement, type Registry, type RenderContext } from '../../core/index.js';

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

const ball = (element: BoardElement, context: RenderContext): Konva.Group => {
  const { group, width, height } = elementBox(element, context, .04, .04);
  const radius = Math.min(width, height) * .43;
  const center = { x: width / 2, y: height / 2 };
  const edge = '#0f172a';
  const baseColor = elementColor(element, '#cbd5e1');
  const seamWidth = Math.max(1.4, width * .035);

  group.add(new Konva.Ellipse({
    x: center.x,
    y: center.y + radius * .87,
    radiusX: radius * .72,
    radiusY: radius * .18,
    fill: '#0f172a',
    opacity: .22
  }));
  group.add(new Konva.Circle({
    ...center,
    radius,
    fillRadialGradientStartPoint: { x: center.x - radius * .35, y: center.y - radius * .4 },
    fillRadialGradientStartRadius: 0,
    fillRadialGradientEndPoint: { x: center.x + radius * .22, y: center.y + radius * .28 },
    fillRadialGradientEndRadius: radius * 1.2,
    fillRadialGradientColorStops: [0, '#ffffff', .55, '#f1f5f9', 1, baseColor],
    stroke: edge,
    strokeWidth: seamWidth,
    shadowColor: '#0f172a',
    shadowBlur: Math.max(4, width * .15),
    shadowOffset: { x: 0, y: Math.max(2, width * .055) },
    shadowOpacity: .28
  }));

  const wave = (offset: number): string => `M ${center.x - radius * 1.2} ${center.y + (offset - .16) * radius} C ${center.x - radius * .4} ${center.y + (offset + .18) * radius}, ${center.x + radius * .4} ${center.y + (offset - .18) * radius}, ${center.x + radius * 1.2} ${center.y + (offset + .16) * radius}`;
  const panels = new Konva.Group({
    clipFunc(canvasContext) {
      canvasContext.arc(center.x, center.y, radius - seamWidth * .35, 0, Math.PI * 2);
    }
  });
  panels.add(new Konva.Path({ data: wave(.72), stroke: '#2563eb', strokeWidth: .62 * radius, lineCap: 'butt' }));
  panels.add(new Konva.Path({ data: wave(.06), stroke: '#fbbf24', strokeWidth: .66 * radius, lineCap: 'butt' }));
  panels.add(new Konva.Path({ data: wave(-.28), stroke: edge, strokeWidth: seamWidth * .8, lineCap: 'round' }));
  panels.add(new Konva.Path({ data: wave(.4), stroke: edge, strokeWidth: seamWidth * .8, lineCap: 'round' }));
  group.add(panels);

  group.add(new Konva.Ellipse({
    x: center.x - radius * .3,
    y: center.y - radius * .52,
    radiusX: radius * .2,
    radiusY: radius * .1,
    rotation: -35,
    fill: '#ffffff',
    opacity: .4
  }));
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

export function registerVolleyballElements(registry: Registry): void {
  registry.registerElement('volleyball.attacker', { defaults: { width: .07, height: .07, data: { number: 1 } }, connectionBoundary: { shape: 'ellipse', margin: .008 }, render: player(false) });
  registry.registerElement('volleyball.defender', { defaults: { width: .07, height: .07, data: { number: 1 } }, connectionBoundary: { shape: 'ellipse', margin: .008 }, render: player(true) });
  registry.registerElement('volleyball.coach', {
    defaults: { width: .07, height: .07 },
    connectable: true,
    connectionBoundary: { shape: 'ellipse', margin: .008 },
    render: coach
  });
  registry.registerElement('volleyball.ball', {
    defaults: { width: .04, height: .04 },
    connectable: false,
    connectionBoundary: { shape: 'ellipse', margin: .006 },
    magnet: {
      targetTypes: ['volleyball.attacker', 'volleyball.defender', 'volleyball.coach'],
      threshold: .075,
      anchors: [{ x: .06, y: .28 }, { x: .94, y: .28 }]
    },
    render: ball
  });
  registry.registerElement('volleyball.cone', { defaults: { width: .04, height: .052 }, connectionBoundary: { shape: 'rectangle', margin: .005 }, render: cone });
}