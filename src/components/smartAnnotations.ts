/**
 * Max/Min smart annotations of StratumHeatmap beyond the classic pin.
 *
 * `cell_badge` draws a round badge in the right corner of the cell, inside the cell and away from
 * the centred value; `legend` writes the two cells next to the colour scale instead of marking them.
 */
import { HeatmapCellData, SmartAnnotationStyle } from '../types';
import { formatMetricValue } from '../utils/formatting';

export type { SmartAnnotationStyle };

export interface SmartAnnotation {
  name: 'Max' | 'Min';
  coord: [number, number];
  value: number;
  meta?: HeatmapCellData;
}

export const SMART_ANNOTATION_ICON: Record<SmartAnnotation['name'], string> = {
  Max: '🏆',
  Min: '📉',
};

const ANNOTATION_LABEL: Record<SmartAnnotation['name'], string> = {
  Max: 'Più alto',
  Min: 'Più basso',
};

const BADGE_STROKE: Record<SmartAnnotation['name'], string> = {
  Max: '#16a34a',
  Min: '#dc2626',
};

const LEGEND_FONT_SIZE = 11;
// Rough width of one character at the legend font size, used to cut long cell names.
const CHAR_WIDTH = 5.6;
// Height of one stacked legend line, and how far from the chart edge the first one starts so that
// it clears the colour scale and its end labels.
const STACKED_LINE_HEIGHT = 16;
const SCALE_CLEARANCE = 56;

const trim = (text: string, maxWidth: number): string => {
  const maxChars = Math.max(4, Math.floor(maxWidth / CHAR_WIDTH));
  return text.length <= maxChars ? text : `${text.slice(0, maxChars - 1)}…`;
};

/** `🏆 Più alto: EMOCROMO · 2026-10 (2.4k)`: what the annotation points at, in words. */
export function describeAnnotation(annotation: SmartAnnotation): string {
  const cell = [annotation.meta?.yValue, annotation.meta?.xValue]
    .filter(part => part !== undefined && part !== null && String(part) !== '')
    .join(' · ');
  const value = formatMetricValue(annotation.value, 'SMART_NUMBER');
  const where = cell ? `${cell} (${value})` : value;
  return `${SMART_ANNOTATION_ICON[annotation.name]} ${ANNOTATION_LABEL[annotation.name]}: ${where}`;
}

/**
 * Custom series drawing a badge on the right edge of each annotated cell. The size of the cell is
 * read at render time, so the badge always stays inside its own cell.
 */
export function buildCellBadgeSeries(annotations: SmartAnnotation[]): any {
  return {
    name: 'StratumHeatmapAnnotations',
    type: 'custom',
    silent: true,
    z: 10,
    // 1 marks the highest cell, 0 the lowest: the series data stays numeric.
    data: annotations.map(a => [a.coord[0], a.coord[1], a.name === 'Max' ? 1 : 0]),
    renderItem: (_params: any, api: any) => {
      const name: SmartAnnotation['name'] = api.value(2) === 1 ? 'Max' : 'Min';
      const center = api.coord([api.value(0), api.value(1)]);
      const [cellWidth, cellHeight] = api.size([1, 1]);
      const radius = Math.max(5, Math.min(11, Math.min(cellWidth, cellHeight) / 2 - 3));
      const cx = center[0] + cellWidth / 2 - radius - 4;
      const cy = center[1];
      return {
        type: 'group',
        children: [
          {
            type: 'circle',
            shape: { cx, cy, r: radius },
            style: { fill: 'rgba(255, 255, 255, 0.92)', stroke: BADGE_STROKE[name], lineWidth: 1.5 },
          },
          {
            type: 'text',
            style: {
              text: SMART_ANNOTATION_ICON[name],
              x: cx,
              y: cy,
              fontSize: Math.round(radius * 1.15),
              textAlign: 'center',
              textVerticalAlign: 'middle',
            },
          },
        ],
      };
    },
  };
}

export interface LegendAnnotationParams {
  annotations: SmartAnnotation[];
  width: number;
  showLegend: boolean;
  legendPosition: 'bottom' | 'top' | 'right';
  visualMapMode: 'continuous' | 'piecewise';
  piecewiseBuckets: number;
}

export interface LegendAnnotationLayout {
  graphic: any[];
  /** Pixels to add to the grid margins so that the extra row does not cover the cells. */
  extraTop: number;
  extraBottom: number;
}

const textElement = (text: string, position: Record<string, number | string | undefined>) => ({
  type: 'text',
  z: 100,
  silent: true,
  ...position,
  style: { text, fontSize: LEGEND_FONT_SIZE, fontWeight: 600, fill: '#475569' },
});

/**
 * The annotations as text next to the colour scale: the highest cell on its left, the lowest on
 * its right. When the chart is too narrow for that, or the scale is vertical or hidden, both go on
 * one centred row: above the scale when it is horizontal, at the bottom edge otherwise.
 */
export function buildLegendAnnotations({
  annotations,
  width,
  showLegend,
  legendPosition,
  visualMapMode,
  piecewiseBuckets,
}: LegendAnnotationParams): LegendAnnotationLayout {
  const none: LegendAnnotationLayout = { graphic: [], extraTop: 0, extraBottom: 0 };
  if (annotations.length === 0) return none;

  const horizontalScale = showLegend && legendPosition !== 'right';
  const scaleHalfWidth = visualMapMode === 'piecewise' ? piecewiseBuckets * 48 + 10 : 90;
  const sideWidth = width / 2 - scaleHalfWidth - 28;
  const texts = annotations.map(describeAnnotation);

  if (horizontalScale && sideWidth >= 120) {
    const edge = legendPosition === 'top' ? { top: 16 } : { bottom: 16 };
    return {
      graphic: annotations.map((annotation, index) => {
        const text = trim(texts[index], sideWidth);
        return annotation.name === 'Max'
          ? textElement(text, { ...edge, right: width / 2 + scaleHalfWidth + 12 })
          : textElement(text, { ...edge, left: width / 2 + scaleHalfWidth + 12 });
      }),
      extraTop: 0,
      extraBottom: 0,
    };
  }

  // One centred line per annotation, stacked: above the scale when it is horizontal, at the chart
  // edge otherwise. The first line is the highest cell.
  const onTop = horizontalScale && legendPosition === 'top';
  const base = horizontalScale ? SCALE_CLEARANCE : 8;
  const lines = texts.length;
  return {
    graphic: texts.map((text, index) => {
      const line = trim(text, width - 40);
      const fromEdge = base + STACKED_LINE_HEIGHT * (onTop ? index : lines - 1 - index);
      return textElement(line, { left: 'center', [onTop ? 'top' : 'bottom']: fromEdge });
    }),
    extraTop: onTop ? STACKED_LINE_HEIGHT * lines - 4 : 0,
    extraBottom: onTop ? 0 : STACKED_LINE_HEIGHT * lines + (horizontalScale ? -4 : 4),
  };
}
