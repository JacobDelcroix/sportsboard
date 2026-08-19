import Konva from 'konva';
import type { Registry } from '../../core/index.js';

const COURT_LENGTH = 28;
const COURT_WIDTH = 15;
const HALF_LENGTH = 14;
const BASKET_OFFSET = 1.575;
const BACKBOARD_OFFSET = 1.2;
const BACKBOARD_WIDTH = 1.8;
const PAINT_DEPTH = 5.8;
const PAINT_WIDTH = 4.9;
const CIRCLE_RADIUS = 1.8;
const THREE_POINT_RADIUS = 6.75;
const CORNER_DISTANCE = .9;
const NO_CHARGE_RADIUS = 1.25;

type Point = { x: number; y: number };

const sampledArc = (center: Point, radius: number, start: number, end: number, steps = 48): Point[] => {
  const points: Point[] = [];
  for (let index = 0; index <= steps; index++) {
    const angle = start + (end - start) * (index / steps);
    points.push({ x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius });
  }
  return points;
};

const courtGroup = (width: number, height: number, horizontal: boolean): Konva.Group => {
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
  const group = courtGroup(width, height, false);
  const x = (meters: number) => meters / COURT_WIDTH * width;
  const y = (meters: number) => meters / HALF_LENGTH * height;
  const scale = (width / COURT_WIDTH + height / HALF_LENGTH) / 2;
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
  const addCircle = (center: Point, radius: number, options: Partial<Konva.CircleConfig> = {}) => group.add(new Konva.Circle({
    x: x(center.x), y: y(center.y), radius: radius * scale, stroke, strokeWidth, ...options
  }));

  const centerX = COURT_WIDTH / 2;
  const basket = { x: centerX, y: BASKET_OFFSET };
  const paintLeft = centerX - PAINT_WIDTH / 2;
  const intersectionY = BASKET_OFFSET + Math.sqrt(THREE_POINT_RADIUS ** 2 - (centerX - CORNER_DISTANCE) ** 2);
  const leftAngle = Math.atan2(intersectionY - basket.y, CORNER_DISTANCE - basket.x);
  const rightAngle = Math.atan2(intersectionY - basket.y, COURT_WIDTH - CORNER_DISTANCE - basket.x);

  group.add(new Konva.Rect({ x: x(paintLeft), y: 0, width: x(PAINT_WIDTH), height: y(PAINT_DEPTH), fill: 'rgba(37,99,235,.07)' }));
  addLine([{ x: paintLeft, y: 0 }, { x: paintLeft, y: PAINT_DEPTH }, { x: paintLeft + PAINT_WIDTH, y: PAINT_DEPTH }, { x: paintLeft + PAINT_WIDTH, y: 0 }]);
  addCircle({ x: centerX, y: PAINT_DEPTH }, CIRCLE_RADIUS, { fill: 'rgba(255,255,255,.025)' });

  addLine([{ x: CORNER_DISTANCE, y: 0 }, { x: CORNER_DISTANCE, y: intersectionY }]);
  addLine([{ x: COURT_WIDTH - CORNER_DISTANCE, y: 0 }, { x: COURT_WIDTH - CORNER_DISTANCE, y: intersectionY }]);
  addLine(sampledArc(basket, THREE_POINT_RADIUS, leftAngle, rightAngle));
  addLine(sampledArc(basket, NO_CHARGE_RADIUS, Math.PI, 0, 28));

  addLine([{ x: centerX - BACKBOARD_WIDTH / 2, y: BACKBOARD_OFFSET }, { x: centerX + BACKBOARD_WIDTH / 2, y: BACKBOARD_OFFSET }], { strokeWidth: strokeWidth * 1.4 });
  addCircle(basket, .225, { stroke: '#f97316', strokeWidth: strokeWidth * 1.4, fill: 'rgba(249,115,22,.10)' });
  addLine([{ x: centerX, y: BACKBOARD_OFFSET }, { x: centerX, y: basket.y - .225 }], { stroke: '#f97316' });

  group.add(new Konva.Rect({ x: strokeWidth / 2, y: strokeWidth / 2, width: width - strokeWidth, height: height - strokeWidth, stroke, strokeWidth, cornerRadius: Math.max(2, strokeWidth) }));
  return group;
};

const renderFullCourt = (width: number, height: number): Konva.Group => {
  const group = courtGroup(width, height, true);
  const x = (meters: number) => meters / COURT_LENGTH * width;
  const y = (meters: number) => meters / COURT_WIDTH * height;
  const scale = (width / COURT_LENGTH + height / COURT_WIDTH) / 2;
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
  const addCircle = (center: Point, radius: number, options: Partial<Konva.CircleConfig> = {}) => group.add(new Konva.Circle({
    x: x(center.x), y: y(center.y), radius: radius * scale, stroke, strokeWidth, ...options
  }));
  const centerY = COURT_WIDTH / 2;
  const cornerDelta = centerY - CORNER_DISTANCE;
  const arcAdvance = Math.sqrt(THREE_POINT_RADIUS ** 2 - cornerDelta ** 2);

  const drawEnd = (right: boolean): void => {
    const direction = right ? -1 : 1;
    const baseline = right ? COURT_LENGTH : 0;
    const basketX = baseline + direction * BASKET_OFFSET;
    const backboardX = baseline + direction * BACKBOARD_OFFSET;
    const paintStart = right ? COURT_LENGTH - PAINT_DEPTH : 0;
    const freeThrowX = baseline + direction * PAINT_DEPTH;
    const arcX = basketX + direction * arcAdvance;
    const paintTop = centerY - PAINT_WIDTH / 2;

    group.add(new Konva.Rect({ x: x(paintStart), y: y(paintTop), width: x(PAINT_DEPTH), height: y(PAINT_WIDTH), fill: 'rgba(37,99,235,.07)' }));
    addLine([
      { x: baseline, y: paintTop }, { x: freeThrowX, y: paintTop },
      { x: freeThrowX, y: paintTop + PAINT_WIDTH }, { x: baseline, y: paintTop + PAINT_WIDTH }
    ]);
    addCircle({ x: freeThrowX, y: centerY }, CIRCLE_RADIUS, { fill: 'rgba(255,255,255,.025)' });

    addLine([{ x: baseline, y: CORNER_DISTANCE }, { x: arcX, y: CORNER_DISTANCE }]);
    addLine([{ x: baseline, y: COURT_WIDTH - CORNER_DISTANCE }, { x: arcX, y: COURT_WIDTH - CORNER_DISTANCE }]);
    const basket = { x: basketX, y: centerY };
    addLine(right
      ? sampledArc(basket, THREE_POINT_RADIUS, Math.PI / 2 + Math.asin(arcAdvance / THREE_POINT_RADIUS), Math.PI * 1.5 - Math.asin(arcAdvance / THREE_POINT_RADIUS))
      : sampledArc(basket, THREE_POINT_RADIUS, -Math.atan2(cornerDelta, arcAdvance), Math.atan2(cornerDelta, arcAdvance))
    );
    addLine(right
      ? sampledArc(basket, NO_CHARGE_RADIUS, Math.PI / 2, Math.PI * 1.5, 28)
      : sampledArc(basket, NO_CHARGE_RADIUS, -Math.PI / 2, Math.PI / 2, 28)
    );

    addLine([{ x: backboardX, y: centerY - BACKBOARD_WIDTH / 2 }, { x: backboardX, y: centerY + BACKBOARD_WIDTH / 2 }], { strokeWidth: strokeWidth * 1.4 });
    addCircle(basket, .225, { stroke: '#f97316', strokeWidth: strokeWidth * 1.4, fill: 'rgba(249,115,22,.10)' });
    addLine([{ x: backboardX, y: centerY }, { x: basketX - direction * .225, y: centerY }], { stroke: '#f97316' });
  };

  drawEnd(false);
  drawEnd(true);
  addLine([{ x: COURT_LENGTH / 2, y: 0 }, { x: COURT_LENGTH / 2, y: COURT_WIDTH }]);
  addCircle({ x: COURT_LENGTH / 2, y: centerY }, CIRCLE_RADIUS, { fill: 'rgba(255,255,255,.025)' });
  group.add(new Konva.Rect({ x: strokeWidth / 2, y: strokeWidth / 2, width: width - strokeWidth, height: height - strokeWidth, stroke, strokeWidth, cornerRadius: Math.max(2, strokeWidth) }));
  return group;
};

export function registerBasketballSurfaces(registry: Registry): void {
  registry.registerSurface('basketball.halfcourt', { ratio: COURT_WIDTH / HALF_LENGTH, render: renderHalfCourt });
  registry.registerSurface('basketball.fullcourt', { ratio: COURT_LENGTH / COURT_WIDTH, render: renderFullCourt });
}
