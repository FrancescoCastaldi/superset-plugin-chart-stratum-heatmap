import { describe, it, expect, vi } from 'vitest';

// The control panel only needs the shared controls it spreads: the real package needs a Superset runtime
vi.mock('@superset-ui/chart-controls', () => ({
  sharedControls: { metric: {}, y_axis_format: { type: 'SelectControl', freeForm: true } },
}));
import { ChartProps } from '@superset-ui/core';
import transformProps from '../src/plugin/transformProps';
import { buildHeatmapOption } from '../src/components/buildHeatmapOption';
import { describeDelta } from '../src/components/comparisonView';
import config from '../src/plugin/controlPanel';

type Row = Record<string, any>;

const run = (formData: Record<string, any>, data: Row[]) =>
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

const cellOf = (props: ReturnType<typeof run>, x: string, y: string): any => {
  const item: any = props.matrixData.find((d: any) => {
    const coords = Array.isArray(d) ? d : d.value;
    return coords[3].xValue === x && coords[3].yValue === y;
  });
  return (Array.isArray(item) ? item : item.value)[3];
};

const visualMapOf = (props: ReturnType<typeof run>): any => {
  const option: any = buildHeatmapOption(props as any);
  return Array.isArray(option.visualMap) ? option.visualMap[0] : option.visualMap;
};

const ratios: Row[] = [
  { GIORNO: 'Lunedì', ORA: '08:00', VALORE: 0.123 },
  { GIORNO: 'Martedì', ORA: '08:00', VALORE: 0.5 },
];

describe('heatmap number format', () => {
  it('keeps the automatic format when none is chosen', () => {
    const props = run({}, [{ GIORNO: 'Lunedì', ORA: '08:00', VALORE: 1200 }]);
    const cell = cellOf(props, 'Lunedì', '08:00');
    expect(cell.formattedValue).toBe('1.2k');
    expect(cell.numberFormat).toBeUndefined();
    expect(props.numberFormat).toBeUndefined();
    expect(visualMapOf(props).formatter).toBeUndefined();
  });

  it('keeps the automatic format when it is chosen explicitly', () => {
    const props = run({ numberFormat: 'SMART_NUMBER' }, [{ GIORNO: 'Lunedì', ORA: '08:00', VALORE: 1200 }]);
    expect(cellOf(props, 'Lunedì', '08:00').formattedValue).toBe('1.2k');
    expect(props.numberFormat).toBeUndefined();
  });

  it('writes the values as percentages when a percentage format is chosen', () => {
    const props = run({ numberFormat: '.1%' }, ratios);
    expect(cellOf(props, 'Lunedì', '08:00').formattedValue).toBe('12.3%');
    expect(cellOf(props, 'Martedì', '08:00').formattedValue).toBe('50.0%');
    expect(cellOf(props, 'Lunedì', '08:00').numberFormat).toBe('.1%');
  });

  it('writes the values as integers', () => {
    const props = run({ numberFormat: ',d' }, [{ GIORNO: 'Lunedì', ORA: '08:00', VALORE: 1234.6 }]);
    expect(cellOf(props, 'Lunedì', '08:00').formattedValue).toBe('1,235');
  });

  it('writes the legend scale in the chosen format, continuous and by bands', () => {
    const continuous = visualMapOf(run({ numberFormat: '.1%' }, ratios));
    expect(continuous.formatter(0.25)).toBe('25.0%');
    const bands = visualMapOf(run({ numberFormat: '.1%', visualMapMode: 'piecewise' }, ratios));
    expect(bands.formatter(0.1, 0.2)).toBe('10.0% - 20.0%');
  });

  it('writes the change between two periods in the chosen format', () => {
    const props = run(
      { numberFormat: '.1%', heatmap_comparison_mode: 'dual_metric', comparison_metric: 'PREC' },
      [{ GIORNO: 'Lunedì', ORA: '08:00', VALORE: 0.5, PREC: 0.4 }],
    );
    const cell = cellOf(props, 'Lunedì', '08:00');
    expect(cell.formattedValue).toBe('50.0%');
    expect(describeDelta(cell)?.text).toBe('▲ +10.0% (+25.0%)');
  });

  it('writes the totals in the chosen format too', () => {
    const props = run({ numberFormat: '.1%', showRowTotals: true, showColumnTotals: true, totalLabel: 'Tot' }, ratios);
    expect(cellOf(props, 'Tot', '08:00').numberFormat).toBe('.1%');
    expect(cellOf(props, 'Tot', '08:00').formattedValue).toBe('62.3%');
  });

  it('lets the duration format win for a Time metric, and only for it', () => {
    const times: Row[] = [{ GIORNO: 'Lunedì', ORA: '08:00', VALORE: '00:10:00' }];
    const props = run({ numberFormat: '.1%' }, times);
    expect(cellOf(props, 'Lunedì', '08:00').formattedValue).toBe('10:00');
    expect(visualMapOf(props).formatter(600)).toBe('10:00');
    // The same chart on a metric of numbers keeps the number format
    expect(cellOf(run({ numberFormat: '.1%' }, ratios), 'Martedì', '08:00').formattedValue).toBe('50.0%');
  });
});

describe('heatmap control panel', () => {
  const controls: any[] = [];
  (config.controlPanelSections as any[]).forEach(section =>
    (section?.controlSetRows || []).forEach((row: any[]) =>
      row.forEach(item => {
        if (item && typeof item === 'object' && item.name) controls.push(item);
      }),
    ),
  );
  const byName = (name: string) => controls.find(c => c.name === name);

  it('always offers the number format, with the automatic one as default', () => {
    const control = byName('numberFormat');
    expect(control).toBeDefined();
    expect(control.config.default).toBe('SMART_NUMBER');
    expect(control.config.visibility).toBeUndefined();
  });

  it('offers the duration format only as an addition, when a Time metric is picked', () => {
    expect(byName('timeDisplayFormat').config.visibility).toBeTypeOf('function');
    expect(byName('timeFractionDigits').config.visibility).toBeTypeOf('function');
  });
});
