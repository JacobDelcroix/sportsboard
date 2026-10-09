import Konva from 'konva';
import type { Registry } from '../../core/index.js';

const COURT_LENGTH = 18;
const COURT_WIDTH = 9;
const HALF_DEPTH = 9;
const FREE_ZONE = 3;
const ATTACK_LINE = 3;
const NET_DEPTH = 1;
const NET_EXTENSION = .25;
const NET_MESH_STEP = .1;
const POST_OFFSET = .85;
const POST_RADIUS = .22;
const ANTENNA_LENGTH = .35;

type Point = { x: number; y: number };

const floorGroup = (width: number, height: number, horizontal: boolean): Konva.Group => {
  const group = new Konva.Group({ listening: false });
  group.add(new Konva.Rect({
    width,
    height,
    fillLinearGradientStartPoint: { x: 0, y: 0 },
    fillLinearGradientEndPoint: horizontal ? { x: width, y: 0 } : { x: 0, y: height },
    fillLinearGradientColorStops: [0, '#d8a15f', .45, '#efc27f', 1, '#d79a56']
  }));

  const bands = 24;
  for (let index = 0; index < bands; index++) {
    group.add(new Konva.Rect({
      x: horizontal ? 0 : width * index / bands,
      y: horizontal ? height * index / bands : 0,
      width: horizontal ? width : width / bands,
      height: horizontal ? height / bands : height,
      fill: index % 2 ? 'rgba(109,62,24,.035)' : 'rgba(255,255,255,.035)'
    }));
  }
  return group;
};

const renderHalfCourt = (width: number, height: number): Konva.Group => {
  const group = floorGroup(width, height, false);
  const scaleX = width / (COURT_WIDTH + FREE_ZONE * 2);
  const scaleY = height / (HALF_DEPTH + FREE_ZONE * 2);
  const x = (meters: number) => (meters + FREE_ZONE) * scaleX;
  const y = (meters: number) => (meters + FREE_ZONE) * scaleY;
  const metricWidth = (meters: number) => meters * scaleX;
  const metricHeight = (meters: number) => meters * scaleY;
  const scale = (scaleX + scaleY) / 2;
  const strokeWidth = Math.max(2, .05 * scale);
  const stroke = '#fffdf7';
  const addLine = (points: Point[], options: Partial<Konva.LineConfig> = {}) => group.add(new Konva.Line({
    points: points.flatMap(point => [x(point.x), y(point.y)]),
    stroke,
    strokeWidth,
    lineCap: 'round',
    lineJoin: 'round',
    ...options
  }));

  group.add(new Konva.Rect({ x: x(0), y: y(0), width: metricWidth(COURT_WIDTH), height: metricHeight(ATTACK_LINE), fill: 'rgba(37,99,235,.07)' }));
  addLine([{ x: 0, y: ATTACK_LINE }, { x: COURT_WIDTH, y: ATTACK_LINE }]);
  addLine([{ x: 0, y: 0 }, { x: COURT_WIDTH, y: 0 }], { strokeWidth: strokeWidth * 1.4 });

  const meshWidth = Math.max(1, .012 * scale);
  group.add(new Konva.Rect({
    x: x(-NET_EXTENSION),
    y: y(-NET_DEPTH / 2),
    width: metricWidth(COURT_WIDTH + NET_EXTENSION * 2),
    height: metricHeight(NET_DEPTH),
    fill: 'rgba(15,23,42,.28)'
  }));
  for (let meters = -NET_DEPTH / 2 + NET_MESH_STEP; meters < NET_DEPTH / 2; meters += NET_MESH_STEP) {
    addLine([{ x: -NET_EXTENSION, y: meters }, { x: COURT_WIDTH + NET_EXTENSION, y: meters }], { stroke: 'rgba(255,255,255,.55)', strokeWidth: meshWidth });
  }
  group.add(new Konva.Rect({
    x: x(-NET_EXTENSION),
    y: y(-NET_DEPTH / 2),
    width: metricWidth(COURT_WIDTH + NET_EXTENSION * 2),
    height: metricHeight(NET_DEPTH),
    stroke: '#e2e8f0',
    strokeWidth: strokeWidth * 1.2
  }));
  const antennaStroke = { stroke: '#dc2626', strokeWidth: strokeWidth * 1.6 };
  addLine([{ x: 0, y: -NET_DEPTH / 2 - ANTENNA_LENGTH }, { x: 0, y: -NET_EXTENSION }], antennaStroke);
  addLine([{ x: COURT_WIDTH, y: -NET_DEPTH / 2 - ANTENNA_LENGTH }, { x: COURT_WIDTH, y: -NET_EXTENSION }], antennaStroke);
  for (const postX of [-POST_OFFSET, COURT_WIDTH + POST_OFFSET]) {
    group.add(new Konva.Circle({ x: x(postX), y: y(0), radius: POST_RADIUS * scale, fill: '#334155', stroke, strokeWidth: strokeWidth * 1.2 }));
  }

  group.add(new Konva.Rect({
    x: x(0),
    y: y(0),
    width: metricWidth(COURT_WIDTH),
    height: metricHeight(HALF_DEPTH),
    stroke,
    strokeWidth,
    cornerRadius: Math.max(2, strokeWidth)
  }));
  return group;
};

const renderFullCourt = (width: number, height: number): Konva.Group => {
  const group = floorGroup(width, height, true);
  const scaleX = width / (COURT_LENGTH + FREE_ZONE * 2);
  const scaleY = height / (COURT_WIDTH + FREE_ZONE * 2);
  const x = (meters: number) => (meters + FREE_ZONE) * scaleX;
  const y = (meters: number) => (meters + FREE_ZONE) * scaleY;
  const metricWidth = (meters: number) => meters * scaleX;
  const metricHeight = (meters: number) => meters * scaleY;
  const scale = (scaleX + scaleY) / 2;
  const strokeWidth = Math.max(2, .05 * scale);
  const stroke = '#fffdf7';
  const addLine = (points: Point[], options: Partial<Konva.LineConfig> = {}) => group.add(new Konva.Line({
    points: points.flatMap(point => [x(point.x), y(point.y)]),
    stroke,
    strokeWidth,
    lineCap: 'round',
    lineJoin: 'round',
    ...options
  }));
  const centerX = COURT_LENGTH / 2;

  for (const side of [-1, 1]) {
    const attackX = centerX + side * (COURT_LENGTH / 2 - ATTACK_LINE);
    group.add(new Konva.Rect({
      x: x(Math.min(attackX, centerX)),
      y: y(0),
      width: metricWidth(Math.abs(attackX - centerX)),
      height: metricHeight(COURT_WIDTH),
      fill: 'rgba(37,99,235,.07)'
    }));
    addLine([{ x: attackX, y: 0 }, { x: attackX, y: COURT_WIDTH }]);
  }
  addLine([{ x: centerX, y: 0 }, { x: centerX, y: COURT_WIDTH }], { strokeWidth: strokeWidth * 1.4 });

  const meshWidth = Math.max(1, .012 * scale);
  group.add(new Konva.Rect({
    x: x(centerX - NET_DEPTH / 2),
    y: y(-NET_EXTENSION),
    width: metricWidth(NET_DEPTH),
    height: metricHeight(COURT_WIDTH + NET_EXTENSION * 2),
    fill: 'rgba(15,23,42,.28)'
  }));
  for (let meters = -NET_DEPTH / 2 + NET_MESH_STEP; meters < NET_DEPTH / 2; meters += NET_MESH_STEP) {
    addLine([{ x: centerX + meters, y: -NET_EXTENSION }, { x: centerX + meters, y: COURT_WIDTH + NET_EXTENSION }], { stroke: 'rgba(255,255,255,.55)', strokeWidth: meshWidth });
  }
  group.add(new Konva.Rect({
    x: x(centerX - NET_DEPTH / 2),
    y: y(-NET_EXTENSION),
    width: metricWidth(NET_DEPTH),
    height: metricHeight(COURT_WIDTH + NET_EXTENSION * 2),
    stroke: '#e2e8f0',
    strokeWidth: strokeWidth * 1.2
  }));
  const antennaStroke = { stroke: '#dc2626', strokeWidth: strokeWidth * 1.6 };
  addLine([{ x: centerX, y: -NET_DEPTH / 2 - ANTENNA_LENGTH }, { x: centerX, y: -NET_EXTENSION }], antennaStroke);
  addLine([{ x: centerX, y: COURT_WIDTH + NET_EXTENSION }, { x: centerX, y: COURT_WIDTH + NET_DEPTH / 2 + ANTENNA_LENGTH }], antennaStroke);
  for (const postY of [-POST_OFFSET, COURT_WIDTH + POST_OFFSET]) {
    group.add(new Konva.Circle({ x: x(centerX), y: y(postY), radius: POST_RADIUS * scale, fill: '#334155', stroke, strokeWidth: strokeWidth * 1.2 }));
  }

  group.add(new Konva.Rect({
    x: x(0),
    y: y(0),
    width: metricWidth(COURT_LENGTH),
    height: metricHeight(COURT_WIDTH),
    stroke,
    strokeWidth,
    cornerRadius: Math.max(2, strokeWidth)
  }));
  return group;
};

export function registerVolleyballSurfaces(registry: Registry): void {
  registry.registerSurface('volleyball.halfcourt', {
    ratio: (COURT_WIDTH + FREE_ZONE * 2) / (HALF_DEPTH + FREE_ZONE * 2),
    render: renderHalfCourt
  });
  registry.registerSurface('volleyball.fullcourt', {
    ratio: (COURT_LENGTH + FREE_ZONE * 2) / (COURT_WIDTH + FREE_ZONE * 2),
    render: renderFullCourt
  });
}