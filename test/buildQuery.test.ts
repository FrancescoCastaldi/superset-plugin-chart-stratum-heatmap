import { describe, it, expect, vi } from 'vitest';

vi.mock('@superset-ui/core', () => ({
  buildQueryContext: (formData: any, buildFn: any) => ({
    queries: buildFn({}),
  }),
  ensureIsArray: (val: any) =>
    val === null || val === undefined ? [] : Array.isArray(val) ? val : [val],
}));

import buildQuery from '../src/plugin/buildQuery';
import { StratumHeatmapFormData } from '../src/types';

describe('StratumHeatmap buildQuery', () => {
  it('builds standard query context without time offsets', () => {
    const formData = {
      datasource: '1__table',
      xAxisDimension: 'col_a',
      yAxisDimension: 'col_b',
      metric: 'count',
    } as any as StratumHeatmapFormData;

    const context = buildQuery(formData);
    const q = (context as any).queries[0];
    expect(q.columns).toEqual(['col_a', 'col_b']);
    expect(q.metrics).toEqual(['count']);
    expect(q.time_offsets).toBeUndefined();
  });

  it('forwards dashboard extra_form_data.time_compare to query.time_offsets', () => {
    const formData = {
      datasource: '1__table',
      xAxisDimension: 'col_a',
      yAxisDimension: 'col_b',
      metric: 'count',
      extra_form_data: {
        time_compare: ['1 year ago'],
      },
    } as any as StratumHeatmapFormData;

    const context = buildQuery(formData);
    const q = (context as any).queries[0];
    expect(q.time_offsets).toEqual(['1 year ago']);
  });
});
