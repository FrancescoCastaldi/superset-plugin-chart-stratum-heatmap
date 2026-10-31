/**
 * Highlighted reference vs comparison view of StratumHeatmap.
 *
 * Off by default: the cells keep the classic "value, delta (percent)" text. With the flag on, each
 * cell shows the value and, under it, a small pill with an arrow and the change, the colour scale
 * of the legend is the one of the deltas, and a header names the two periods.
 */
import { DeltaColorScale, DeltaDisplayType, HeatmapCellData } from '../types';
import { formatMetricValue } from '../utils/formatting';

// Same end points as the diverging palettes of transformProps: [negative, positive].
const BIPOLAR_ENDS: [string, string] = ['#dc2626', '#059669'];
const INVERTED_ENDS: [string, string] = ['#059669', '#dc2626'];
const NEUTRAL = '#f8fafc';

export const COMPARISON_RICH = {
  v: { fontWeight: 700, align: 'center' },
  up: {
    color: '#047857',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: [1, 4],
    borderRadius: 8,
    align: 'center',
    fontSize: 10,
    fontWeight: 700,
  },
  down: {
    color: '#b91c1c',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: [1, 4],
    borderRadius: 8,
    align: 'center',
    fontSize: 10,
    fontWeight: 700,
  },
  flat: {
    color: '#475569',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: [1, 4],
    borderRadius: 8,
    align: 'center',
    fontSize: 10,
    fontWeight: 600,
  },
  fresh: {
    color: '#0369a1',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: [1, 4],
    borderRadius: 8,
    align: 'center',
    fontSize: 10,
    fontWeight: 700,
  },
};

// With the inverted scale an increase is bad news: the pill takes the colour of the cell scale.
const INVERTED_RICH = {
  up: { ...COMPARISON_RICH.up, color: '#b91c1c' },
  down: { ...COMPARISON_RICH.down, color: '#047857' },
};

export const comparisonRich = (colorScale?: DeltaColorScale) =>
  colorScale === 'polarity_inverted' ? { ...COMPARISON_RICH, ...INVERTED_RICH } : COMPARISON_RICH;

/** True when at least one cell carries a comparison value. */
export function hasComparisonData(matrixData: any[]): boolean {
  return matrixData.some(item => {
    const coords = Array.isArray(item) ? item : item?.value;
    const meta: HeatmapCellData | undefined = coords?.[3];
    return meta?.comparisonValue !== undefined && meta?.comparisonValue !== null;
  });
}

const signed = (n: number): string => `${n > 0 ? '+' : n < 0 ? '-' : ''}${formatMetricValue(Math.abs(n), 'SMART_NUMBER')}`;

/** Text of the pill under the value: `▲ +123 (+12.3%)`, `▼ -4`, `= 0`, or the new-cell label. */
export function describeDelta(
  meta: HeatmapCellData,
  deltaDisplayType: DeltaDisplayType = 'both',
  zeroBaselineBadgeLabel = 'Nuovo',
): { text: string; tone: 'up' | 'down' | 'flat' | 'fresh' } | null {
  if (meta.comparisonValue === undefined || meta.comparisonValue === null) return null;
  if (meta.isZeroBaseline) return { text: zeroBaselineBadgeLabel, tone: 'fresh' };
  if (meta.delta === undefined || meta.delta === null) return null;

  const tone = meta.delta > 0 ? 'up' : meta.delta < 0 ? 'down' : 'flat';
  const arrow = tone === 'up' ? '▲' : tone === 'down' ? '▼' : '=';
  const absolute = signed(meta.delta);
  const percent =
    meta.deltaPercent !== null && meta.deltaPercent !== undefined
      ? `${meta.deltaPercent > 0 ? '+' : ''}${meta.deltaPercent.toFixed(1)}%`
      : null;

  let body: string;
  if (deltaDisplayType === 'absolute' || !percent) body = absolute;
  else if (deltaDisplayType === 'percentage') body = percent;
  else body = `${absolute} (${percent})`;
  return { text: tone === 'flat' ? `= ${body}` : `${arrow} ${body}`, tone };
}

export type ComparisonLayout = 'stacked' | 'inline' | 'compact';

/**
 * How much of the change fits in a cell: stacked (pill under the value) in tall cells, inline (pill
 * beside the value) in wide and short ones, compact (just the arrow) when the cell is small.
 */
export function pickComparisonLayout(cellWidth: number, cellHeight: number): ComparisonLayout {
  if (!(cellHeight > 0) || cellHeight >= 34) return 'stacked';
  return cellWidth >= 150 ? 'inline' : 'compact';
}

/** Rich label of a cell in the highlighted view: the value and the pill with the change. */
export function buildComparisonLabel(
  meta: HeatmapCellData,
  value: number,
  deltaDisplayType?: DeltaDisplayType,
  zeroBaselineBadgeLabel?: string,
  layout: ComparisonLayout = 'stacked',
): string {
  const valueText = formatMetricValue(value, 'SMART_NUMBER');
  const delta = describeDelta(meta, deltaDisplayType, zeroBaselineBadgeLabel);
  if (!delta) return `{v|${valueText}}`;
  if (layout === 'compact') {
    const mark = delta.tone === 'fresh' ? delta.text : delta.text.split(' ')[0];
    return `{v|${valueText}} {${delta.tone}|${mark}}`;
  }
  return `{v|${valueText}}${layout === 'inline' ? '  ' : '\n'}{${delta.tone}|${delta.text}}`;
}

export interface ComparisonOverlayParams {
  width: number;
  showLegend: boolean;
  legendPosition: 'bottom' | 'top' | 'right';
  xAxisPosition: 'top' | 'bottom';
  time1Label?: string;
  time2Label?: string;
  deltaColorScale?: DeltaColorScale;
  maxAbsDelta: number;
}

export interface ComparisonOverlay {
  graphic: any[];
  /** The value scale of the legend is replaced by the delta scale: the cells are coloured by delta. */
  hideVisualMap: boolean;
  extraTop: number;
  extraBottom: number;
}

const FONT = 11;
const SCALE_HALF = 75;

/**
 * Header with the two periods and the meaning of the arrows, and, when the cells are coloured by
 * delta, the delta scale in the place of the legend. The header goes on the edge opposite to the
 * scale so that the two never collide.
 */
export function buildComparisonOverlay({
  width,
  showLegend,
  legendPosition,
  xAxisPosition,
  time1Label,
  time2Label,
  deltaColorScale = 'bipolar_diverging',
  maxAbsDelta,
}: ComparisonOverlayParams): ComparisonOverlay {
  const byDelta = deltaColorScale !== 'sequential_standard';
  const scaleOnTop = showLegend && legendPosition === 'top';
  const reference = time1Label || 'Reference';
  const comparison = time2Label || 'Comparison';
  const graphic: any[] = [];

  // Header on the edge opposite to the scale.
  const headerText = `${reference}  vs  ${comparison}      ▲ up   ▼ down`;
  const headerEdge = scaleOnTop ? { bottom: 6 } : { top: 6 };
  graphic.push({
    type: 'text',
    z: 100,
    silent: true,
    left: 'center',
    ...headerEdge,
    style: { text: headerText, fontSize: FONT, fontWeight: 700, fill: '#334155' },
  });
  // Axis labels at the bottom already clear their own margin; on top the header needs its own row.
  const headerNeedsRoom = scaleOnTop ? true : xAxisPosition === 'bottom';
  const extraTop = !scaleOnTop && headerNeedsRoom ? 18 : 0;
  const extraBottom = scaleOnTop ? 20 : 0;

  if (byDelta && showLegend) {
    const [negative, positive] = deltaColorScale === 'polarity_inverted' ? INVERTED_ENDS : BIPOLAR_ENDS;
    const barEdge = scaleOnTop ? { top: 24 } : { bottom: 14 };
    const labelEdge = scaleOnTop ? { top: 8 } : { bottom: 28 };
    const bound = formatMetricValue(maxAbsDelta, 'SMART_NUMBER');
    graphic.push(
      {
        type: 'rect',
        z: 100,
        silent: true,
        left: width / 2 - SCALE_HALF,
        ...barEdge,
        shape: { width: SCALE_HALF * 2, height: 10, r: 3 },
        style: {
          fill: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: negative },
              { offset: 0.5, color: NEUTRAL },
              { offset: 1, color: positive },
            ],
          },
          stroke: '#cbd5e1',
          lineWidth: 1,
        },
      },
      {
        type: 'text',
        z: 100,
        silent: true,
        left: width / 2 - SCALE_HALF,
        ...labelEdge,
        style: { text: `-${bound}`, fontSize: FONT, fill: '#475569' },
      },
      {
        type: 'text',
        z: 100,
        silent: true,
        right: width / 2 - SCALE_HALF,
        ...labelEdge,
        style: { text: `+${bound}`, fontSize: FONT, fill: '#475569' },
      },
    );
  }

  return { graphic, hideVisualMap: byDelta && showLegend, extraTop, extraBottom };
}
