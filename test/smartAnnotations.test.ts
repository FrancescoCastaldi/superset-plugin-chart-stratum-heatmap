import { describe, it, expect } from 'vitest';
import { buildHeatmapOption } from '../src/components/buildHeatmapOption';
import {
  buildCellBadgeSeries,
  buildLegendAnnotations,
  describeAnnotation,
} from '../src/components/smartAnnotations';
import { HeatmapCellData } from '../src/types';

const meta = (overrides: Partial<HeatmapCellData>): HeatmapCellData => ({
  xValue: '2026-10',
  yValue: 'EMOCROMO',
  xIndex: 0,
  yIndex: 0,
  value: 0,
  formattedValue: '',
  rowTotal: 0,
  colTotal: 0,
  grandTotal: 0,
  rowPercentage: 0,
  colPercentage: 0,
  totalPercentage: 0,
  ...overrides,
});

const matrixData = [
  { value: [0, 0, 2442, meta({ yValue: 'EMOCROMO', yIndex: 0, value: 2442 })] },
  { value: [0, 1, 1900, meta({ yValue: 'GLUCOSIO', yIndex: 1, value: 1900 })] },
  { value: [0, 2, 1373, meta({ yValue: 'PRELIEVO VENOSO', yIndex: 2, value: 1373 })] },
] as any[];

const params = (overrides: Record<string, unknown> = {}) => ({
  xCategories: ['2026-10'],
  yCategories: ['EMOCROMO', 'GLUCOSIO', 'PRELIEVO VENOSO'],
  matrixData,
  minValue: 1373,
  maxValue: 2442,
  visualMapMode: 'continuous' as const,
  colorRange: ['#eef4f9', '#1c3d5e'],
  showLegend: true,
  legendPosition: 'bottom' as const,
  xAxisPosition: 'top' as const,
  showSmartAnnotations: true,
  width: 1520,
  xAxisDimension: 'DATA',
  yAxisDimension: 'PRESTAZIONE',
  ...overrides,
});

const annotations = [
  { name: 'Max' as const, coord: [0, 0] as [number, number], value: 2442, meta: meta({}) },
  {
    name: 'Min' as const,
    coord: [0, 2] as [number, number],
    value: 1373,
    meta: meta({ yValue: 'PRELIEVO VENOSO', yIndex: 2 }),
  },
];

describe('smart annotation style', () => {
  it('keeps the pin over the cell by default', () => {
    const option = buildHeatmapOption(params());
    expect(option.series[0].markPoint.data).toHaveLength(2);
    expect(option.series).toHaveLength(1);
    expect(option.graphic).toBeUndefined();
  });

  it('draws a badge series inside the cells and no pin with the cell_badge style', () => {
    const option = buildHeatmapOption(params({ smartAnnotationStyle: 'cell_badge' }));
    expect(option.series[0].markPoint).toBeUndefined();
    expect(option.series).toHaveLength(2);
    expect(option.series[1]).toMatchObject({ type: 'custom', silent: true });
    expect(option.series[1].data).toEqual([
      [0, 0, 1],
      [0, 2, 0],
    ]);
    // The colour scale must not repaint the badge series.
    expect(option.visualMap.seriesIndex).toBe(0);
  });

  it('keeps each badge inside its own cell, on the right side, clear of the centred value', () => {
    const series = buildCellBadgeSeries(annotations);
    const api = {
      value: (dim: number) => series.data[0][dim],
      coord: () => [500, 100],
      size: () => [200, 30],
    };
    const group = series.renderItem({}, api);
    const circle = group.children[0].shape;

    expect(circle.cx + circle.r).toBeLessThanOrEqual(500 + 100);
    expect(circle.cx - circle.r).toBeGreaterThan(500);
    expect(circle.cy - circle.r).toBeGreaterThanOrEqual(100 - 15);
    expect(circle.cy + circle.r).toBeLessThanOrEqual(100 + 15);
    expect(group.children[1].style.text).toBe('🏆');
  });

  it('shrinks the badge on a small cell instead of spilling over the cell above', () => {
    const series = buildCellBadgeSeries(annotations);
    const api = {
      value: (dim: number) => series.data[1][dim],
      coord: () => [500, 100],
      size: () => [60, 14],
    };
    const group = series.renderItem({}, api);
    const circle = group.children[0].shape;

    expect(circle.cy - circle.r).toBeGreaterThanOrEqual(100 - 14 / 2 - 1);
    expect(circle.cy + circle.r).toBeLessThanOrEqual(100 + 14 / 2 + 1);
    expect(group.children[1].style.text).toBe('📉');
  });

  it('marks nothing on the cells and writes both cells beside the scale with the legend style', () => {
    const option = buildHeatmapOption(params({ smartAnnotationStyle: 'legend' }));
    expect(option.series).toHaveLength(1);
    expect(option.series[0].markPoint).toBeUndefined();
    expect(option.graphic).toHaveLength(2);

    const [max, min] = option.graphic;
    expect(max.style.text).toBe('🏆 Più alto: EMOCROMO · 2026-10 (2.4k)');
    expect(min.style.text).toBe('📉 Più basso: PRELIEVO VENOSO · 2026-10 (1.4k)');
    // Highest cell on the left of the scale, lowest on its right, both on the scale's row.
    expect(max.right).toBeGreaterThan(1520 / 2);
    expect(min.left).toBeGreaterThan(1520 / 2);
    expect(max.bottom).toBe(min.bottom);
    expect(option.grid.bottom).toBe(65);
  });

  it('puts the legend row on the top edge when the scale is on top', () => {
    const option = buildHeatmapOption(
      params({ smartAnnotationStyle: 'legend', legendPosition: 'top' }),
    );
    expect(option.graphic[0].top).toBe(16);
    expect(option.graphic[0].bottom).toBeUndefined();
  });

  it('stacks one centred line per cell above the scale and makes room when the chart is too narrow', () => {
    const option = buildHeatmapOption(params({ smartAnnotationStyle: 'legend', width: 420 }));
    expect(option.graphic).toHaveLength(2);
    expect(option.graphic.every((g: any) => g.left === 'center')).toBe(true);
    expect(option.graphic[0].style.text).toContain('🏆');
    expect(option.graphic[1].style.text).toContain('📉');
    // The highest cell is the upper line, both clear of the scale labels.
    expect(option.graphic[0].bottom).toBeGreaterThan(option.graphic[1].bottom);
    expect(option.graphic[1].bottom).toBeGreaterThanOrEqual(56);
    expect(option.grid.bottom).toBe(65 + 28);
  });

  it('stacks the lines at the bottom edge when the scale is hidden', () => {
    const option = buildHeatmapOption(
      params({ smartAnnotationStyle: 'legend', showLegend: false }),
    );
    expect(option.graphic).toHaveLength(2);
    expect(option.graphic[1].bottom).toBe(8);
    expect(option.graphic[0].bottom).toBe(24);
    expect(option.grid.bottom).toBe(16 + 36);
  });

  it('stacks the lines below the top scale and pushes the grid down', () => {
    const option = buildHeatmapOption(
      params({ smartAnnotationStyle: 'legend', legendPosition: 'top', width: 420 }),
    );
    expect(option.graphic[0].top).toBeLessThan(option.graphic[1].top);
    expect(option.graphic[0].top).toBeGreaterThanOrEqual(56);
    expect(option.grid.top).toBe(65 + 28);
  });

  it('cuts a long cell name instead of running into the scale', () => {
    const longMeta = meta({ yValue: 'A'.repeat(120) });
    const layout = buildLegendAnnotations({
      annotations: [{ ...annotations[0], meta: longMeta }],
      width: 900,
      showLegend: true,
      legendPosition: 'bottom',
      visualMapMode: 'continuous',
      piecewiseBuckets: 5,
    });
    const text: string = layout.graphic[0].style.text;
    expect(text.length).toBeLessThan(describeAnnotation({ ...annotations[0], meta: longMeta }).length);
    expect(text.endsWith('…')).toBe(true);
  });

  it('shows no annotation at all when they are switched off, whatever the style', () => {
    for (const style of ['pin', 'cell_badge', 'legend']) {
      const option = buildHeatmapOption(
        params({ smartAnnotationStyle: style, showSmartAnnotations: false }),
      );
      expect(option.series).toHaveLength(1);
      expect(option.series[0].markPoint).toBeUndefined();
      expect(option.graphic).toBeUndefined();
    }
  });
});
