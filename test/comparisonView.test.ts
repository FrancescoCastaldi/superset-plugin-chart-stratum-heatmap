import { describe, it, expect } from 'vitest';
import { ChartProps } from '@superset-ui/core';
import { buildHeatmapOption } from '../src/components/buildHeatmapOption';
import {
  buildComparisonLabel,
  buildComparisonOverlay,
  describeDelta,
  pickComparisonLayout,
} from '../src/components/comparisonView';
import transformProps from '../src/plugin/transformProps';
import { HeatmapCellData } from '../src/types';

const meta = (overrides: Partial<HeatmapCellData> = {}): HeatmapCellData => ({
  xValue: 'Ott',
  yValue: 'EMOCROMO',
  xIndex: 0,
  yIndex: 0,
  value: 120,
  formattedValue: '120',
  rowTotal: 0,
  colTotal: 0,
  grandTotal: 0,
  rowPercentage: 0,
  colPercentage: 0,
  totalPercentage: 0,
  comparisonValue: 100,
  delta: 20,
  deltaPercent: 20,
  isZeroBaseline: false,
  ...overrides,
});

describe('describeDelta', () => {
  it('writes arrow, absolute change and percent by default', () => {
    expect(describeDelta(meta())).toEqual({ text: '▲ +20 (+20.0%)', tone: 'up' });
    expect(describeDelta(meta({ delta: -5, deltaPercent: -5 }))).toEqual({
      text: '▼ -5 (-5.0%)',
      tone: 'down',
    });
  });

  it('follows the display type of the chart', () => {
    expect(describeDelta(meta(), 'absolute')?.text).toBe('▲ +20');
    expect(describeDelta(meta(), 'percentage')?.text).toBe('▲ +20.0%');
  });

  it('falls back to the absolute change when there is no percent, and marks a flat cell', () => {
    expect(describeDelta(meta({ deltaPercent: null }), 'both')?.text).toBe('▲ +20');
    expect(describeDelta(meta({ delta: 0, deltaPercent: 0 }))).toEqual({
      text: '= 0 (0.0%)',
      tone: 'flat',
    });
  });

  it('uses the label of the new cells and stays silent without a comparison', () => {
    expect(describeDelta(meta({ isZeroBaseline: true, comparisonValue: 0 }), 'both', 'Nuovo')).toEqual({
      text: 'Nuovo',
      tone: 'fresh',
    });
    expect(describeDelta(meta({ comparisonValue: null, delta: null }))).toBeNull();
  });
});

describe('buildComparisonLabel', () => {
  it('puts the value first and the pill under it', () => {
    expect(buildComparisonLabel(meta(), 120)).toBe('{v|120}\n{up|▲ +20 (+20.0%)}');
  });

  it('shows just the value when the cell has no comparison', () => {
    expect(buildComparisonLabel(meta({ comparisonValue: null, delta: null }), 120)).toBe('{v|120}');
  });
});

describe('buildComparisonOverlay', () => {
  const base = {
    width: 900,
    showLegend: true,
    legendPosition: 'bottom' as const,
    xAxisPosition: 'top' as const,
    time1Label: 'ott 2026',
    time2Label: 'set 2026',
    maxAbsDelta: 250,
  };

  it('writes the header on the top edge and the delta scale at the bottom', () => {
    const overlay = buildComparisonOverlay(base);
    const header = overlay.graphic[0];
    expect(header.style.text).toContain('ott 2026  vs  set 2026');
    expect(header.top).toBe(6);
    expect(overlay.hideVisualMap).toBe(true);

    const bar = overlay.graphic.find(g => g.type === 'rect');
    expect(bar.bottom).toBe(14);
    expect(bar.style.fill.colorStops.map((s: any) => s.color)).toEqual(['#dc2626', '#f8fafc', '#059669']);
    expect(overlay.graphic.filter(g => g.type === 'text').map(g => g.style.text)).toEqual(
      expect.arrayContaining(['-250', '+250']),
    );
  });

  it('flips the scale with the inverted polarity', () => {
    const bar = buildComparisonOverlay({ ...base, deltaColorScale: 'polarity_inverted' }).graphic.find(
      g => g.type === 'rect',
    );
    expect(bar.style.fill.colorStops[0].color).toBe('#059669');
    expect(bar.style.fill.colorStops[2].color).toBe('#dc2626');
  });

  it('moves the header to the bottom when the scale is on top', () => {
    const overlay = buildComparisonOverlay({ ...base, legendPosition: 'top' });
    expect(overlay.graphic[0].bottom).toBe(6);
    expect(overlay.graphic[0].top).toBeUndefined();
    expect(overlay.graphic.find(g => g.type === 'rect').top).toBe(24);
    expect(overlay.extraBottom).toBeGreaterThan(0);
  });

  it('keeps the value scale when the colours are sequential, and names the periods anyway', () => {
    const overlay = buildComparisonOverlay({ ...base, deltaColorScale: 'sequential_standard' });
    expect(overlay.hideVisualMap).toBe(false);
    expect(overlay.graphic).toHaveLength(1);
  });

  it('makes room for the header when the axis labels are at the bottom', () => {
    expect(buildComparisonOverlay({ ...base, xAxisPosition: 'bottom' }).extraTop).toBeGreaterThan(0);
    expect(buildComparisonOverlay(base).extraTop).toBe(0);
  });

  it('falls back to generic period names', () => {
    const overlay = buildComparisonOverlay({ ...base, time1Label: undefined, time2Label: undefined });
    expect(overlay.graphic[0].style.text).toContain('Riferimento  vs  Confronto');
  });
});

const cell = (x: number, y: number, value: number, comp: number | null, name: string) => ({
  value: [
    x,
    y,
    value,
    meta({
      xValue: 'Ott',
      yValue: name,
      xIndex: x,
      yIndex: y,
      value,
      comparisonValue: comp,
      delta: comp === null ? null : value - comp,
      deltaPercent: comp ? ((value - comp) / Math.abs(comp)) * 100 : null,
    }),
  ],
});

const params = (overrides: Record<string, unknown> = {}) => ({
  xCategories: ['Ott'],
  yCategories: ['A', 'B'],
  matrixData: [cell(0, 0, 120, 100, 'A'), cell(0, 1, 40, 80, 'B')] as any[],
  minValue: 40,
  maxValue: 120,
  visualMapMode: 'continuous' as const,
  colorRange: ['#eef4f9', '#1c3d5e'],
  showLegend: true,
  legendPosition: 'bottom' as const,
  xAxisPosition: 'top' as const,
  showValues: true,
  showSmartAnnotations: false,
  time1Label: 'ott 2026',
  time2Label: 'set 2026',
  maxAbsDelta: 40,
  width: 900,
  xAxisDimension: 'MESE',
  yAxisDimension: 'PRESTAZIONE',
  ...overrides,
});

const labelOf = (option: any, x: number, y: number, value: number, comp: number | null, name: string) =>
  option.series[0].label.formatter({ data: cell(x, y, value, comp, name) });

describe('comparison layout by cell size', () => {
  it('stacks the pill under the value in tall cells, or when the size is unknown', () => {
    expect(pickComparisonLayout(100, 60)).toBe('stacked');
    expect(pickComparisonLayout(100, 34)).toBe('stacked');
    expect(pickComparisonLayout(0, 0)).toBe('stacked');
  });

  it('puts the pill beside the value in wide, short cells and shrinks it in small ones', () => {
    expect(pickComparisonLayout(400, 26)).toBe('inline');
    expect(pickComparisonLayout(150, 26)).toBe('inline');
    expect(pickComparisonLayout(90, 26)).toBe('compact');
  });

  it('writes each layout', () => {
    expect(buildComparisonLabel(meta(), 120, 'both', 'Nuovo', 'stacked')).toBe('{v|120}\n{up|▲ +20 (+20.0%)}');
    expect(buildComparisonLabel(meta(), 120, 'both', 'Nuovo', 'inline')).toBe('{v|120}  {up|▲ +20 (+20.0%)}');
    expect(buildComparisonLabel(meta(), 120, 'both', 'Nuovo', 'compact')).toBe('{v|120} {up|▲}');
    expect(
      buildComparisonLabel(meta({ isZeroBaseline: true, comparisonValue: 0 }), 120, 'both', 'Nuovo', 'compact'),
    ).toBe('{v|120} {fresh|Nuovo}');
  });

  it('picks the layout from the size of the chart in the option', () => {
    const wide = buildHeatmapOption({
      ...params(),
      yCategories: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      comparisonHighlight: true,
      width: 900,
      height: 330,
    });
    expect(wide.series[0].label.formatter({ data: cell(0, 0, 120, 100, 'A') })).toBe(
      '{v|120}  {up|▲ +20 (+20.0%)}',
    );
    const tall = buildHeatmapOption({
      ...params(),
      yCategories: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      comparisonHighlight: true,
      width: 900,
      height: 900,
    });
    expect(tall.series[0].label.formatter({ data: cell(0, 0, 120, 100, 'A') })).toBe(
      '{v|120}\n{up|▲ +20 (+20.0%)}',
    );
  });
});

describe('highlighted comparison in the option', () => {
  it('leaves the classic view alone when the flag is off', () => {
    const option = buildHeatmapOption(params());
    expect(option.graphic).toBeUndefined();
    expect(option.series[0].label.rich).toBeUndefined();
    expect(option.visualMap.show).toBe(true);
    expect(labelOf(option, 0, 0, 120, 100, 'A')).toBe('120\n+20 (+20.0%)');
  });

  it('writes the pill, the header and the delta scale when the flag is on', () => {
    const option = buildHeatmapOption(params({ comparisonHighlight: true }));
    expect(labelOf(option, 0, 0, 120, 100, 'A')).toBe('{v|120}\n{up|▲ +20 (+20.0%)}');
    expect(labelOf(option, 0, 1, 40, 80, 'B')).toBe('{v|40}\n{down|▼ -40 (-50.0%)}');
    expect(option.series[0].label.rich.up).toBeDefined();
    expect(option.visualMap.show).toBe(false);
    expect(option.graphic.some((g: any) => /ott 2026 {2}vs {2}set 2026/.test(g.style?.text ?? ''))).toBe(true);
  });

  it('does nothing when the flag is on but the data has no comparison', () => {
    const matrixData = [cell(0, 0, 120, null, 'A'), cell(0, 1, 40, null, 'B')] as any[];
    const option = buildHeatmapOption(params({ comparisonHighlight: true, matrixData }));
    expect(option.graphic).toBeUndefined();
    expect(option.visualMap.show).toBe(true);
    expect(option.series[0].label.rich).toBeUndefined();
  });

  it('swaps the pill colours with the inverted polarity', () => {
    const option = buildHeatmapOption(
      params({ comparisonHighlight: true, deltaColorScale: 'polarity_inverted' }),
    );
    expect(option.series[0].label.rich.up.color).toBe('#b91c1c');
    expect(option.series[0].label.rich.down.color).toBe('#047857');
  });

  it('keeps the plain total cells', () => {
    const option = buildHeatmapOption(params({ comparisonHighlight: true }));
    const total = { value: [1, 0, 500, meta({ isRowTotal: true, comparisonValue: null, delta: null })] };
    expect(option.series[0].label.formatter({ data: total })).toBe('500');
  });
});

describe('highlighted comparison in the chart props', () => {
  const props = (formData: Record<string, unknown>) =>
    ({
      width: 800,
      height: 600,
      formData: {
        xAxisDimension: 'GIORNO',
        yAxisDimension: 'ORA',
        metric: 'N',
        comparison_metric: 'N_conf',
        heatmap_comparison_mode: 'dual_metric',
        showRowTotals: false,
        showColumnTotals: false,
        ...formData,
      },
      queriesData: [
        {
          data: [
            { GIORNO: 'Lun', ORA: '08', N: 0, N_conf: 30 },
            { GIORNO: 'Lun', ORA: '09', N: 40, N_conf: 20 },
          ],
        },
      ],
    } as unknown as ChartProps);

  it('shows the label of a cell that dropped to zero only in the highlighted view', () => {
    const classic = transformProps(props({}));
    const highlighted = transformProps(props({ comparisonHighlight: true }));
    const zeroCell = (p: any) => p.matrixData.find((d: any) => d.value[3].yValue === '08');
    expect(zeroCell(classic).label.show).toBe(false);
    expect(zeroCell(highlighted).label.show).toBe(true);
    expect(highlighted.comparisonHighlight).toBe(true);
    expect(classic.comparisonHighlight).toBe(false);
  });
});
