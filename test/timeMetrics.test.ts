import { describe, it, expect } from 'vitest';
import { ChartProps } from '@superset-ui/core';
import transformProps from '../src/plugin/transformProps';
import { buildHeatmapOption } from '../src/components/buildHeatmapOption';
import { describeDelta } from '../src/components/comparisonView';
import { describeAnnotation } from '../src/components/smartAnnotations';
import { formatMetricValue } from '../src/utils/formatting';
import { formatDuration, parseTimeToSeconds } from '../src/utils/timeValues';
import { hasTimeMetric } from '../src/plugin/timeMetricHints';

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
      metric: 'ATTESA',
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

const waiting: Row[] = [
  { GIORNO: 'Lunedì', ORA: '08:00', ATTESA: '00:10:00' },
  { GIORNO: 'Lunedì', ORA: '09:00', ATTESA: '00:20:00' },
  { GIORNO: 'Martedì', ORA: '08:00', ATTESA: '00:30:00' },
];

describe('time values in the heatmap', () => {
  it('reads times and writes durations', () => {
    expect(parseTimeToSeconds('00:12:54.425000')).toBeCloseTo(774.425, 6);
    expect(formatDuration(774.425)).toBe('12:54');
    expect(formatMetricValue(600, 'SMART_NUMBER', { format: 'auto' })).toBe('10:00');
    expect(formatMetricValue(1200, 'SMART_NUMBER')).toBe('1.2k');
    expect(formatMetricValue(null, 'SMART_NUMBER', { format: 'auto' })).toBe('—');
  });
});

describe('heatmap with a Time metric', () => {
  it('reads the cells as seconds instead of zero', () => {
    const props = run({}, waiting);
    expect(cellOf(props, 'Lunedì', '08:00').value).toBe(600);
    expect(cellOf(props, 'Lunedì', '09:00').value).toBe(1200);
    expect(cellOf(props, 'Martedì', '08:00').value).toBe(1800);
    expect(props.minValue).toBe(600);
    expect(props.maxValue).toBe(1800);
  });

  it('writes the cells as durations', () => {
    const props = run({}, waiting);
    expect(cellOf(props, 'Lunedì', '08:00').formattedValue).toBe('10:00');
    expect(props.timeFormat?.referenceSeconds).toBe(1800);
  });

  it('follows the format and the decimals chosen', () => {
    const props = run({ timeDisplayFormat: 'minutes', timeFractionDigits: 1 }, waiting);
    expect(cellOf(props, 'Lunedì', '08:00').formattedValue).toBe('10 min');
    expect(cellOf(run({ timeDisplayFormat: 'hms' }, waiting), 'Lunedì', '08:00').formattedValue).toBe('0:10:00');
  });

  it('averages the cells with data in the totals instead of adding them', () => {
    const props = run({ showRowTotals: true, showColumnTotals: true, totalLabel: 'Tot' }, waiting);
    // Row 08:00 has Lunedì (600) and Martedì (1800); row 09:00 only Lunedì (1200)
    expect(cellOf(props, 'Tot', '08:00').value).toBe(1200);
    expect(cellOf(props, 'Tot', '09:00').value).toBe(1200);
    // Column Lunedì has 600 and 1200; Martedì only 1800
    expect(cellOf(props, 'Lunedì', 'Tot').value).toBe(900);
    expect(cellOf(props, 'Martedì', 'Tot').value).toBe(1800);
    expect(cellOf(props, 'Tot', 'Tot').value).toBe(1200);
    expect(cellOf(props, 'Tot', 'Tot').formattedValue).toBe('20:00');
  });

  it('keeps the sum of the totals when the metric is a count', () => {
    const props = run(
      { metric: 'N', showRowTotals: true, showColumnTotals: true, totalLabel: 'Tot' },
      [
        { GIORNO: 'Lunedì', ORA: '08:00', N: 10 },
        { GIORNO: 'Martedì', ORA: '08:00', N: 30 },
      ],
    );
    expect(props.timeFormat).toBeUndefined();
    expect(cellOf(props, 'Tot', '08:00').value).toBe(40);
  });

  it('writes the legend scale and the tooltip as durations', () => {
    const props = run({}, waiting);
    const option: any = buildHeatmapOption(props as any);
    const visualMap = Array.isArray(option.visualMap) ? option.visualMap[0] : option.visualMap;
    expect(visualMap.formatter(600)).toBe('10:00');
    const piece = Array.isArray(option.visualMap) ? option.visualMap[0] : option.visualMap;
    expect(piece.formatter(0)).toBe('00:00');
  });

  it('leaves the scale alone for a metric of numbers', () => {
    const props = run({ metric: 'N' }, [{ GIORNO: 'Lunedì', ORA: '08:00', N: 10 }]);
    const option: any = buildHeatmapOption(props as any);
    const visualMap = Array.isArray(option.visualMap) ? option.visualMap[0] : option.visualMap;
    expect(visualMap.formatter).toBeUndefined();
  });

  it('never reads a dimension as a time', () => {
    const props = run({ yAxisDimension: 'FASCIA' }, [
      { GIORNO: 'Lunedì', FASCIA: '08:00:00', ATTESA: '00:10:00' },
      { GIORNO: 'Lunedì', FASCIA: '13:00:00', ATTESA: '00:20:00' },
    ]);
    expect(props.yCategories).toEqual(['08:00:00', '13:00:00']);
    expect(cellOf(props, 'Lunedì', '08:00:00').value).toBe(600);
  });

  describe('comparison between two periods', () => {
    const rows: Row[] = [
      { GIORNO: 'Lunedì', ORA: '08:00', ATTESA: '00:15:00', ATTESA_CONF: '00:10:00' },
    ];
    const props = run(
      { heatmap_comparison_mode: 'dual_metric', comparison_metric: 'ATTESA_CONF' },
      rows,
    );
    const cell = cellOf(props, 'Lunedì', '08:00');

    it('reads the comparison metric as seconds and computes the delta on them', () => {
      expect(cell.value).toBe(900);
      expect(cell.comparisonValue).toBe(600);
      expect(cell.delta).toBe(300);
      expect(cell.deltaPercent).toBe(50);
    });

    it('writes the change as a duration with its percentage', () => {
      expect(describeDelta(cell)?.text).toBe('▲ +05:00 (+50.0%)');
    });
  });

  it('writes the cell of an annotation as a duration', () => {
    const props = run({}, waiting);
    const cell = cellOf(props, 'Martedì', '08:00');
    const text = describeAnnotation({ name: 'max', value: 1800, meta: cell } as any);
    expect(text).toContain('30:00');
  });
});

describe('hasTimeMetric', () => {
  const dataset = {
    columns: [{ column_name: 'TempoAttesa', type: 'TIME' }],
    metrics: [{ metric_name: 'Attesa Sportello', expression: 'AVG([TempoAttesa])' }, { metric_name: 'Numero', expression: 'COUNT(*)' }],
  };
  const panel = (controls: Record<string, unknown>) => ({ controls: { datasource: { datasource: dataset }, ...controls } });

  it('shows for a Time metric and stays hidden for counts', () => {
    expect(hasTimeMetric(panel({ metric: { value: 'Attesa Sportello' } }))).toBe(true);
    expect(hasTimeMetric(panel({ comparison_metric: { value: 'Attesa Sportello' } }))).toBe(true);
    expect(hasTimeMetric(panel({ metric: { value: 'Numero' } }))).toBe(false);
    expect(hasTimeMetric({})).toBe(false);
  });
});


describe('hasTimeMetric with the dataset as Explore passes it', () => {
  const dataset = {
    columns: [{ column_name: 'TempoAttesa', type: 'TIME' }, { column_name: 'Richieste', type: 'INTEGER' }],
    metrics: [{ metric_name: 'Attesa Sportello', expression: 'AVG([TempoAttesa])' }, { metric_name: 'Numero', expression: 'COUNT(*)' }],
  };

  it('finds a saved metric on a Time column when the dataset is on the props, not in the controls', () => {
    const props = { datasource: dataset, controls: { metric: { value: 'Attesa Sportello' } } };
    expect(hasTimeMetric(props as any)).toBe(true);
  });

  it('stays hidden for a count when the dataset is on the props', () => {
    const props = { datasource: dataset, controls: { metric: { value: 'Numero' } } };
    expect(hasTimeMetric(props as any)).toBe(false);
  });
});
