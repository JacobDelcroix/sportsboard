import Konva from 'konva';
import type { Registry } from '../../core/index.js';

const PITCH_LENGTH = 105;
const PITCH_WIDTH = 68;
const HALF_LENGTH = PITCH_LENGTH / 2;
const PITCH_RUNOFF = 4;
const CENTER_RADIUS = 9.15;
const PENALTY_AREA_DEPTH = 16.5;
const PENALTY_AREA_WIDTH = 40.32;
const GOAL_AREA_DEPTH = 5.5;
const GOAL_AREA_WIDTH = 18.32;
const GOAL_WIDTH = 7.32;
const PENALTY_SPOT = 11;
const CORNER_RADIUS = 1;

interface MetricPoint { x: number; y: number }

const sampledArc = (center: MetricPoint, radius: number, start: number, end: number, steps = 32): MetricPoint[] => {
  const points: MetricPoint[] = [];
  for (let index = 0; index <= steps; index += 1) {
    const angle = start + (end - start) * index / steps;
    points.push({ x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius });
  }
  return points;
};

const grass = (width: number, height: number, verticalStripes: boolean): Konva.Group => {
  const group = new Konva.Group({ listening: false });
  group.add(new Konva.Rect({
    width,
    height,
    fillLinearGradientStartPoint: { x: 0, y: 0 },
    fillLinearGradientEndPoint: { x: width, y: height },
    fillLinearGradientColorStops: [0, '#176b3a', .48, '#23824a', 1, '#155e35']
  }));
  const stripes = verticalStripes ? 14 : 10;
  for (let index = 0; index < stripes; index += 1) {
    group.add(new Konva.Rect({
      x: verticalStripes ? width * index / stripes : 0,
      y: verticalStripes ? 0 : height * index / stripes,
      width: verticalStripes ? width / stripes : width,
      height: verticalStripes ? height : height / stripes,
      fill: index % 2 ? 'rgba(255,255,255,.035)' : 'rgba(3,46,24,.045)'
    }));
  }
  group.add(new Konva.Rect({ width, height, fill: 'rgba(255,255,255,.015)' }));
  return group;
};

const renderFullPitch = (width: number, height: number): Konva.Group => {
  const group = grass(width, height, true);
  const surfaceWidth = PITCH_LENGTH + PITCH_RUNOFF * 2;
  const surfaceHeight = PITCH_WIDTH + PITCH_RUNOFF * 2;
  const scaleX = width / surfaceWidth;
  const scaleY = height / surfaceHeight;
  const x = (meters: number) => (meters + PITCH_RUNOFF) * scaleX;
  const y = (meters: number) => (meters + PITCH_RUNOFF) * scaleY;
  const metricWidth = (meters: number) => meters * scaleX;
  const metricHeight = (meters: number) => meters * scaleY;
  const scale = (scaleX + scaleY) / 2;
  const strokeWidth = Math.max(1.7, .1 * scale);
  const stroke = 'rgba(255,255,255,.94)';
  const line = (points: MetricPoint[], options: Partial<Konva.LineConfig> = {}) => group.add(new Konva.Line({
    points: points.flatMap(point => [x(point.x), y(point.y)]), stroke, strokeWidth, lineCap: 'round', lineJoin: 'round', ...options
  }));
  const rect = (left: number, top: number, metricWidth: number, metricHeight: number, options: Partial<Konva.RectConfig> = {}) => group.add(new Konva.Rect({
    x: x(left), y: y(top), width: metricWidth * scaleX, height: metricHeight * scaleY, stroke, strokeWidth, ...options
  }));
  const circle = (center: MetricPoint, radius: number, options: Partial<Konva.CircleConfig> = {}) => group.add(new Konva.Circle({
    x: x(center.x), y: y(center.y), radius: radius * scale, stroke, strokeWidth, ...options
  }));

  const centerY = PITCH_WIDTH / 2;
  const drawEnd = (right: boolean): void => {
    const baseline = right ? PITCH_LENGTH : 0;
    const direction = right ? -1 : 1;
    const penaltyLeft = right ? PITCH_LENGTH - PENALTY_AREA_DEPTH : 0;
    const goalLeft = right ? PITCH_LENGTH - GOAL_AREA_DEPTH : 0;
    const penaltyTop = centerY - PENALTY_AREA_WIDTH / 2;
    const goalTop = centerY - GOAL_AREA_WIDTH / 2;
    const spot = { x: baseline + direction * PENALTY_SPOT, y: centerY };
    rect(penaltyLeft, penaltyTop, PENALTY_AREA_DEPTH, PENALTY_AREA_WIDTH, { fill: 'rgba(255,255,255,.018)' });
    rect(goalLeft, goalTop, GOAL_AREA_DEPTH, GOAL_AREA_WIDTH);
    circle(spot, .16, { fill: stroke, strokeWidth: 0 });
    const arcAngle = Math.acos((PENALTY_AREA_DEPTH - PENALTY_SPOT) / CENTER_RADIUS);
    line(right
      ? sampledArc(spot, CENTER_RADIUS, Math.PI - arcAngle, Math.PI + arcAngle)
      : sampledArc(spot, CENTER_RADIUS, -arcAngle, arcAngle));

    const goalDepth = 2.2;
    const goalX = right ? PITCH_LENGTH : -goalDepth;
    rect(goalX, centerY - GOAL_WIDTH / 2, goalDepth, GOAL_WIDTH, { fill: 'rgba(226,232,240,.12)', dash: [3, 3] });
  };

  drawEnd(false);
  drawEnd(true);
  line([{ x: PITCH_LENGTH / 2, y: 0 }, { x: PITCH_LENGTH / 2, y: PITCH_WIDTH }]);
  circle({ x: PITCH_LENGTH / 2, y: centerY }, CENTER_RADIUS, { fill: 'rgba(255,255,255,.018)' });
  circle({ x: PITCH_LENGTH / 2, y: centerY }, .16, { fill: stroke, strokeWidth: 0 });

  line(sampledArc({ x: 0, y: 0 }, CORNER_RADIUS, 0, Math.PI / 2, 12));
  line(sampledArc({ x: 0, y: PITCH_WIDTH }, CORNER_RADIUS, -Math.PI / 2, 0, 12));
  line(sampledArc({ x: PITCH_LENGTH, y: 0 }, CORNER_RADIUS, Math.PI / 2, Math.PI, 12));
  line(sampledArc({ x: PITCH_LENGTH, y: PITCH_WIDTH }, CORNER_RADIUS, Math.PI, Math.PI * 1.5, 12));
  group.add(new Konva.Rect({
    x: x(0),
    y: y(0),
    width: metricWidth(PITCH_LENGTH),
    height: metricHeight(PITCH_WIDTH),
    stroke,
    strokeWidth
  }));
  return group;
};

const renderHalfPitch = (width: number, height: number): Konva.Group => {
  const group = grass(width, height, false);
  const surfaceWidth = PITCH_WIDTH + PITCH_RUNOFF * 2;
  const surfaceHeight = HALF_LENGTH + PITCH_RUNOFF * 2;
  const scaleX = width / surfaceWidth;
  const scaleY = height / surfaceHeight;
  const x = (meters: number) => (meters + PITCH_RUNOFF) * scaleX;
  const y = (meters: number) => (meters + PITCH_RUNOFF) * scaleY;
  const metricWidth = (meters: number) => meters * scaleX;
  const metricHeight = (meters: number) => meters * scaleY;
  const scale = (scaleX + scaleY) / 2;
  const strokeWidth = Math.max(1.7, .1 * scale);
  const stroke = 'rgba(255,255,255,.94)';
  const line = (points: MetricPoint[], options: Partial<Konva.LineConfig> = {}) => group.add(new Konva.Line({
    points: points.flatMap(point => [x(point.x), y(point.y)]), stroke, strokeWidth, lineCap: 'round', lineJoin: 'round', ...options
  }));
  const rect = (left: number, top: number, metricWidth: number, metricHeight: number, options: Partial<Konva.RectConfig> = {}) => group.add(new Konva.Rect({
    x: x(left), y: y(top), width: metricWidth * scaleX, height: metricHeight * scaleY, stroke, strokeWidth, ...options
  }));
  const circle = (center: MetricPoint, radius: number, options: Partial<Konva.CircleConfig> = {}) => group.add(new Konva.Circle({
    x: x(center.x), y: y(center.y), radius: radius * scale, stroke, strokeWidth, ...options
  }));

  const centerX = PITCH_WIDTH / 2;
  const penaltyLeft = centerX - PENALTY_AREA_WIDTH / 2;
  const goalLeft = centerX - GOAL_AREA_WIDTH / 2;
  rect(penaltyLeft, 0, PENALTY_AREA_WIDTH, PENALTY_AREA_DEPTH, { fill: 'rgba(255,255,255,.018)' });
  rect(goalLeft, 0, GOAL_AREA_WIDTH, GOAL_AREA_DEPTH);
  const spot = { x: centerX, y: PENALTY_SPOT };
  circle(spot, .16, { fill: stroke, strokeWidth: 0 });
  const arcAngle = Math.asin((PENALTY_AREA_DEPTH - PENALTY_SPOT) / CENTER_RADIUS);
  line(sampledArc(spot, CENTER_RADIUS, arcAngle, Math.PI - arcAngle));
  rect(centerX - GOAL_WIDTH / 2, -2.2, GOAL_WIDTH, 2.2, { fill: 'rgba(226,232,240,.12)', dash: [3, 3] });

  line([{ x: 0, y: HALF_LENGTH }, { x: PITCH_WIDTH, y: HALF_LENGTH }]);
  line(sampledArc({ x: centerX, y: HALF_LENGTH }, CENTER_RADIUS, Math.PI, Math.PI * 2));
  circle({ x: centerX, y: HALF_LENGTH }, .16, { fill: stroke, strokeWidth: 0 });
  line(sampledArc({ x: 0, y: 0 }, CORNER_RADIUS, 0, Math.PI / 2, 12));
  line(sampledArc({ x: PITCH_WIDTH, y: 0 }, CORNER_RADIUS, Math.PI / 2, Math.PI, 12));
  group.add(new Konva.Rect({
    x: x(0),
    y: y(0),
    width: metricWidth(PITCH_WIDTH),
    height: metricHeight(HALF_LENGTH),
    stroke,
    strokeWidth
  }));
  return group;
};

export function registerFootballSurfaces(registry: Registry): void {
  registry.registerSurface('football.halfpitch', {
    ratio: (PITCH_WIDTH + PITCH_RUNOFF * 2) / (HALF_LENGTH + PITCH_RUNOFF * 2),
    render: renderHalfPitch
  });
  registry.registerSurface('football.fullpitch', {
    ratio: (PITCH_LENGTH + PITCH_RUNOFF * 2) / (PITCH_WIDTH + PITCH_RUNOFF * 2),
    render: renderFullPitch
  });
}
