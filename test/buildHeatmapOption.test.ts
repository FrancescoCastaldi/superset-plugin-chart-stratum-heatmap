import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildHeatmapOption } from '../src/components/buildHeatmapOption';
import { HeatmapCellData, HeatmapDatum } from '../src/types';

const fixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, '__fixtures__', 'heatmapOption.fixture.json'), 'utf8'),
) as { params: any; option: any };

const clone = (value: unknown) => JSON.parse(JSON.stringify(value));

const meta = (overrides: Partial<HeatmapCellData> = {}): HeatmapCellData => ({
  xValue: 'Lunedì',
  yValue: '08:00',
  xIndex: 0,
  yIndex: 0,
  value: 42,
  formattedValue: '42',
  rowTotal: 100,
  colTotal: 200,
  grandTotal: 400,
  rowPercentage: 42,
  colPercentage: 21,
  totalPercentage: 10.5,
  ...overrides,
});

const baseParams = (overrides: Record<string, unknown> = {}) => ({
  ...fixture.params,
  ...overrides,
});

describe('buildHeatmapOption', () => {
  it('characterization: reproduces the pre-refactor option fixture byte-for-byte (JSON)', () => {
    const option = buildHeatmapOption(baseParams());
    expect(clone(option)).toEqual(fixture.option);
  });

  it('maps visualMap mode, bounds, palette and legend placement', () => {
    const continuous = buildHeatmapOption(baseParams());
    expect(continuous.visualMap.type).toBe('continuous');
    expect(continuous.visualMap.dimension).toBe(2);
    expect(continuous.visualMap.min).toBe(fixture.params.minValue);
    expect(continuous.visualMap.max).toBe(fixture.params.maxValue);
    expect(continuous.visualMap.calculable).toBe(true);
    expect(continuous.visualMap.inRange.color).toEqual(fixture.params.colorRange);

    const piecewise = buildHeatmapOption(baseParams({ visualMapMode: 'piecewise', piecewiseBuckets: 7 }));
    expect(piecewise.visualMap.type).toBe('piecewise');
    expect(piecewise.visualMap.splitNumber).toBe(7);
    expect(piecewise.visualMap.calculable).toBe(false);
  });

  it('computes grid insets from x-axis position and legend placement', () => {
    expect(buildHeatmapOption(baseParams()).grid).toEqual({ top: 42, right: 28, bottom: 65, left: 60, containLabel: true });
    expect(buildHeatmapOption(baseParams({ legendPosition: 'right' })).grid).toEqual({ top: 42, right: 80, bottom: 16, left: 60, containLabel: true });
    expect(buildHeatmapOption(baseParams({ legendPosition: 'top' })).grid).toEqual({ top: 65, right: 28, bottom: 16, left: 60, containLabel: true });
    expect(buildHeatmapOption(baseParams({ legendPosition: 'top', showLegend: false })).grid).toEqual({ top: 42, right: 28, bottom: 16, left: 60, containLabel: true });
    expect(buildHeatmapOption(baseParams({ xAxisPosition: 'bottom' })).grid).toEqual({ top: 24, right: 28, bottom: 65, left: 60, containLabel: true });
  });

  it('highlights the active cell with the selection border style', () => {
    const option = buildHeatmapOption(baseParams({ activeCell: { x: 'Martedì', y: '08:00' } }));
    const selected = option.series[0].data.find(
      (d: any) => d.value[3].xValue === 'Martedì' && d.value[3].yValue === '08:00',
    );
    const notSelected = option.series[0].data.find((d: any) => d.value[3].xValue === 'Lunedì');

    expect(selected.itemStyle).toMatchObject({
      borderColor: '#0284c7',
      borderWidth: 3,
      shadowBlur: 8,
      shadowColor: 'rgba(2, 132, 199, 0.6)',
    });
    expect(notSelected.itemStyle.borderColor).toBe('#ffffff');
    expect(notSelected.itemStyle.borderWidth).toBe(1);
    expect(notSelected.itemStyle.borderRadius).toBe(4);
  });

  it('preserves per-cell colors from the transformed matrix data', () => {
    const option = buildHeatmapOption(baseParams());
    const first = option.series[0].data[0];
    expect(first.itemStyle.color).toBe('#eef4f9');
    expect(first.label).toEqual({ color: '#1c3d5e', fontWeight: 600 });
  });

  it('toggles smart annotations (markPoint) with showSmartAnnotations', () => {
    expect(buildHeatmapOption(baseParams()).series[0].markPoint).toBeDefined();
    expect(buildHeatmapOption(baseParams({ showSmartAnnotations: false })).series[0].markPoint).toBeUndefined();
  });

  it('renders tooltip HTML for ordinary cells and totals', () => {
    const option = buildHeatmapOption(baseParams());
    const formatter = option.tooltip.formatter;

    const ordinary = formatter({ data: { value: [0, 0, 42, meta()] } });
    expect(ordinary).toContain('Lunedì × 08:00');
    expect(ordinary).toContain('42');
    expect(ordinary).toContain('% su riga (08:00)');
    expect(ordinary).toContain('% su colonna (Lunedì)');
    expect(ordinary).toContain('% su volume totale');

    const noPercentages = buildHeatmapOption(baseParams({ showPercentages: false })).tooltip.formatter({
      data: { value: [0, 0, 42, meta()] },
    });
    expect(noPercentages).not.toContain('% su riga');

    const rowTotal = formatter({ data: { value: [0, 0, 42, meta({ isRowTotal: true })] } });
    expect(rowTotal).toContain('Totale Riga: 08:00');
    expect(rowTotal).toContain('Clicca per filtrare su ORA: "08:00"');

    const colTotal = formatter({ data: { value: [0, 0, 42, meta({ isColTotal: true })] } });
    expect(colTotal).toContain('Totale Colonna: Lunedì');
    expect(colTotal).toContain('Clicca per filtrare su GIORNO: "Lunedì"');

    const grandTotal = formatter({ data: { value: [0, 0, 42, meta({ isGrandTotal: true })] } });
    expect(grandTotal).toContain('Totale Generale');
    expect(grandTotal).toContain('Clicca per azzerare i filtri attivi');

    expect(formatter({ data: { value: [0, 0, 42, undefined] } })).toBe('');
    expect(formatter({})).toBe('');
  });

  it('formats series labels honoring showZeroValues and null values', () => {
    const labelFormatter = buildHeatmapOption(baseParams()).series[0].label.formatter;
    expect(labelFormatter({ data: { value: [0, 0, 42, meta()] } })).toBe('42');
    expect(labelFormatter({ data: { value: [0, 0, 0, meta()] } })).toBe('');
    expect(labelFormatter({ data: { value: [0, 0, null, meta()] } })).toBe('');

    const withZeros = buildHeatmapOption(baseParams({ showZeroValues: true })).series[0].label.formatter;
    expect(withZeros({ data: { value: [0, 0, 0, meta()] } })).toBe('0');
  });

  it('accepts the raw tuple form of matrix data', () => {
    const tuple: [number, number, number | null, HeatmapCellData] = [0, 0, 42, meta()];
    const option = buildHeatmapOption(baseParams({ matrixData: [tuple] as HeatmapDatum[] }));
    expect(option.series[0].data).toHaveLength(1);
    expect(option.series[0].data[0].value).toBe(tuple);
  });
});
