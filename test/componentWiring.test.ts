import { describe, it, expect, vi } from 'vitest';
import { ChartProps } from '@superset-ui/core';
import transformProps from '../src/plugin/transformProps';
import { heatmapOptionFromProps } from '../src/components/heatmapOption';

// The option the component draws, built from the props it receives: the same path as the chart on screen
vi.mock('@superset-ui/chart-controls', () => ({
  sharedControls: { metric: {}, y_axis_format: {} },
}));

const run = (formData: Record<string, unknown>, data: Record<string, unknown>[]) =>
  transformProps({
    width: 800,
    height: 600,
    formData: {
      datasource: '1__table',
      viz_type: 'stratum_heatmap',
      xAxisDimension: 'GIORNO',
      yAxisDimension: 'ORA',
      metric: 'VALORE',
      showRowTotals: false,
      showColumnTotals: false,
      ...formData,
    },
    queriesData: [{ data }],
  } as unknown as ChartProps);

const ratios = [
  { GIORNO: 'Lunedì', ORA: '08:00', VALORE: 0.123 },
  { GIORNO: 'Martedì', ORA: '08:00', VALORE: 0.5 },
];

describe('the component draws the formats it receives', () => {
  it('writes the legend scale in the number format chosen', () => {
    const option: any = heatmapOptionFromProps(run({ numberFormat: '.1%' }, ratios) as any);
    const visualMap = Array.isArray(option.visualMap) ? option.visualMap[0] : option.visualMap;
    expect(visualMap.formatter(0.25)).toBe('25.0%');
  });

  it('writes the legend scale by bands in the number format chosen', () => {
    const option: any = heatmapOptionFromProps(
      run({ numberFormat: '.1%', visualMapMode: 'piecewise' }, ratios) as any,
    );
    const visualMap = Array.isArray(option.visualMap) ? option.visualMap[0] : option.visualMap;
    expect(visualMap.formatter(0.1, 0.2)).toBe('10.0% - 20.0%');
  });

  it('writes the legend scale as durations for a Time metric', () => {
    const option: any = heatmapOptionFromProps(
      run({}, [
        { GIORNO: 'Lunedì', ORA: '08:00', VALORE: '00:10:00' },
        { GIORNO: 'Martedì', ORA: '08:00', VALORE: '00:30:00' },
      ]) as any,
    );
    const visualMap = Array.isArray(option.visualMap) ? option.visualMap[0] : option.visualMap;
    expect(visualMap.formatter(600)).toBe('10:00');
  });

  it('keeps the automatic legend when no format is chosen', () => {
    const option: any = heatmapOptionFromProps(run({}, ratios) as any);
    const visualMap = Array.isArray(option.visualMap) ? option.visualMap[0] : option.visualMap;
    expect(visualMap.formatter).toBeUndefined();
  });
});
