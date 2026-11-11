import { describe, it, expect, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ChartProps } from '@superset-ui/core';

vi.mock('@superset-ui/chart-controls', () => ({
  sharedControls: {
    groupby: { type: 'DndColumnSelect' },
    metric: { type: 'DndMetricSelect' },
    y_axis_format: { type: 'SelectControl' },
  },
}));

import controlPanel from '../src/plugin/controlPanel';
import transformProps from '../src/plugin/transformProps';

type ControlEntry = { name: string; config: Record<string, any> };

const flattenControls = (): ControlEntry[] => {
  const result: ControlEntry[] = [];
  for (const section of controlPanel.controlPanelSections) {
    for (const row of section.controlSetRows) {
      for (const item of row) {
        if (item && typeof item === 'object' && 'name' in item && 'config' in item) {
          result.push(item as ControlEntry);
        }
      }
    }
  }
  return result;
};

const controlByName = (name: string): ControlEntry => {
  const found = flattenControls().find(c => c.name === name);
  if (!found) throw new Error(`Missing control: ${name}`);
  return found;
};

const controlsWith = (overrides: Record<string, unknown> = {}) => {
  const map: Record<string, { value: unknown }> = {};
  for (const ctrl of flattenControls()) {
    map[ctrl.name] = { value: ctrl.config.default };
  }
  for (const [k, v] of Object.entries(overrides)) {
    map[k] = { value: v };
  }
  return map;
};

describe('StratumHeatmap controlPanel', () => {
  it('uses Italian StratumBar section structure with only Dati expanded, full descriptions and no emojis', () => {
    const sections = controlPanel.controlPanelSections;
    expect(sections.map(s => s.label)).toEqual([
      'Dati',
      'Confronto tra periodi',
      'Formato dei valori',
      'Totali',
      'Aspetto',
      'Interazione',
    ]);
    expect(sections[0].expanded).toBe(true);
    for (const section of sections.slice(1)) {
      expect(section.expanded).toBe(false);
    }

    const emojiPattern = /\p{Extended_Pictographic}/u;
    for (const section of sections) {
      expect(typeof (section as any).description).toBe('string');
      expect(((section as any).description as string).trim().length).toBeGreaterThan(10);
      expect(emojiPattern.test(String(section.label))).toBe(false);
    }

    for (const ctrl of flattenControls()) {
      expect(typeof ctrl.config.label).toBe('string');
      expect((ctrl.config.label as string).trim().length).toBeGreaterThan(0);
      expect(emojiPattern.test(ctrl.config.label)).toBe(false);
      expect(typeof ctrl.config.description).toBe('string');
      expect((ctrl.config.description as string).trim().length).toBeGreaterThan(10);
    }
  });

  it('requires xAxisDimension, yAxisDimension and metric and runs query when comparison mode changes', () => {
    for (const required of ['xAxisDimension', 'yAxisDimension', 'metric']) {
      const cfg = controlByName(required).config;
      expect(cfg.validators.length).toBeGreaterThan(0);
      expect(typeof cfg.validators[0](null)).toBe('string');
      expect(cfg.validators[0]('COL')).toBeFalsy();
    }

    const cmp = controlByName('heatmap_comparison_mode').config;
    expect(cmp.renderTrigger).toBe(false);
    const periodColChoice = (cmp.choices as [string, string][]).find(([k]) => k === 'period_column');
    expect(periodColChoice?.[1]).toBe('Colonne di confronto già nei dati');

    expect(controlByName('time_1_label').config.default).toBe('');
    expect(controlByName('time_2_label').config.default).toBe('');
  });

  it('keeps rows compact (at most 2 controls per row) and applies progressive disclosure', () => {
    for (const section of controlPanel.controlPanelSections) {
      for (const row of section.controlSetRows) {
        expect(row.length).toBeLessThanOrEqual(2);
      }
    }

    const vis = (name: string, overrides: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) =>
      Boolean(controlByName(name).config.visibility?.({ controls: controlsWith(overrides), ...extra }));

    expect(vis('xAxisSortAsc', { smartSort: true })).toBe(true);
    expect(vis('yAxisSortAsc', { smartSort: true })).toBe(true);
    expect(vis('xAxisSortAsc', { smartSort: false })).toBe(false);
    expect(vis('yAxisSortAsc', { smartSort: false })).toBe(false);

    expect(vis('comparison_metric', { heatmap_comparison_mode: 'none' })).toBe(false);
    expect(vis('comparison_metric', { heatmap_comparison_mode: 'time_offsets' })).toBe(false);
    expect(vis('comparison_metric', { heatmap_comparison_mode: 'dual_metric' })).toBe(true);

    for (const name of [
      'time_1_label',
      'time_2_label',
      'delta_display_type',
      'delta_color_scale',
      'comparisonHighlight',
      'zero_baseline_badge_label',
    ]) {
      expect(vis(name, { heatmap_comparison_mode: 'none' })).toBe(false);
      expect(vis(name, { heatmap_comparison_mode: 'period_column' })).toBe(true);
    }

    expect(vis('piecewiseBuckets', { visualMapMode: 'continuous' })).toBe(false);
    expect(vis('piecewiseBuckets', { visualMapMode: 'piecewise' })).toBe(true);

    expect(vis('valueFontSize', { showValues: false })).toBe(false);
    expect(vis('showZeroValues', { showValues: false })).toBe(false);
    expect(vis('valueFontSize', { showValues: true })).toBe(true);

    expect(vis('smartAnnotationStyle', { showSmartAnnotations: false })).toBe(false);
    expect(vis('showAnnotationLegend', { showSmartAnnotations: false })).toBe(false);
    expect(vis('smartAnnotationThreshold', { showSmartAnnotations: false })).toBe(false);
    expect(vis('smartAnnotationStyle', { showSmartAnnotations: true })).toBe(true);

    expect(vis('legendPosition', { showLegend: false })).toBe(false);
    expect(vis('legendPosition', { showLegend: true })).toBe(true);

    expect(vis('totalLabel', { showRowTotals: false, showColumnTotals: false })).toBe(false);
    expect(vis('totalAggregation', { showRowTotals: false, showColumnTotals: false })).toBe(false);
    expect(vis('totalLabel', { showRowTotals: true, showColumnTotals: false })).toBe(true);

    // Duration controls: hidden on numeric metric at default, visible if Time metric OR customized
    expect(vis('timeDisplayFormat', { metric: 'accessi' })).toBe(false);
    expect(vis('timeFractionDigits', { metric: 'accessi' })).toBe(false);
    expect(vis('timeDisplayFormat', { metric: 'tempo_attesa' })).toBe(true);
    expect(vis('timeFractionDigits', { metric: 'tempo_attesa' })).toBe(true);
    expect(vis('timeDisplayFormat', { metric: 'accessi', timeDisplayFormat: 'minutes' })).toBe(true);
    expect(vis('timeFractionDigits', { metric: 'accessi', timeFractionDigits: 2 })).toBe(true);
  });

  it('wires every control name to code and aligns panel defaults with transformProps defaults', () => {
    const transformSrc = fs.readFileSync(path.join(__dirname, '../src/plugin/transformProps.ts'), 'utf8');
    const querySrc = fs.readFileSync(path.join(__dirname, '../src/plugin/buildQuery.ts'), 'utf8');

    const stringRows = controlPanel.controlPanelSections
      .flatMap(s => s.controlSetRows.flat())
      .filter((x): x is string => typeof x === 'string');

    for (const item of stringRows) {
      expect(querySrc.includes(item) || item === 'adhoc_filters' || item === 'row_limit').toBe(true);
    }

    for (const { name } of flattenControls()) {
      expect(transformSrc.includes(name) || querySrc.includes(name)).toBe(true);
    }

    const transformed = transformProps({
      width: 800,
      height: 600,
      formData: {
        datasource: '1__table',
        viz_type: 'stratum_heatmap',
        xAxisDimension: 'GIORNO',
        yAxisDimension: 'ORA',
        metric: 'CONTEGGIO',
      },
      queriesData: [
        {
          data: [
            { GIORNO: 'Lunedì', ORA: '08:00', CONTEGGIO: 10 },
            { GIORNO: 'Martedì', ORA: '09:00', CONTEGGIO: 20 },
          ],
        },
      ],
    } as unknown as ChartProps);

    expect(transformed.numberFormat).toBeUndefined();
    const withExplicitDefaultFmt = transformProps({
      width: 800,
      height: 600,
      formData: {
        datasource: '1__table',
        viz_type: 'stratum_heatmap',
        xAxisDimension: 'GIORNO',
        yAxisDimension: 'ORA',
        metric: 'CONTEGGIO',
        numberFormat: controlByName('numberFormat').config.default,
      },
      queriesData: [
        {
          data: [
            { GIORNO: 'Lunedì', ORA: '08:00', CONTEGGIO: 10 },
            { GIORNO: 'Martedì', ORA: '09:00', CONTEGGIO: 20 },
          ],
        },
      ],
    } as unknown as ChartProps);
    expect(withExplicitDefaultFmt.numberFormat).toBe(transformed.numberFormat);
    expect(transformed.heatmapComparisonMode).toBe(controlByName('heatmap_comparison_mode').config.default);
    expect(transformed.deltaDisplayType).toBe(controlByName('delta_display_type').config.default);
    expect(transformed.deltaColorScale).toBe(controlByName('delta_color_scale').config.default);
    expect(transformed.comparisonHighlight).toBe(controlByName('comparisonHighlight').config.default);
    expect(transformed.zeroBaselineBadgeLabel).toBe(controlByName('zero_baseline_badge_label').config.default);
    expect(transformed.visualMapMode).toBe(controlByName('visualMapMode').config.default);
    expect(transformed.piecewiseBuckets).toBe(controlByName('piecewiseBuckets').config.default);
    expect(transformed.zeroCellNeutral).toBe(controlByName('zeroCellNeutral').config.default);
    expect(transformed.cellRadius).toBe(controlByName('cellRadius').config.default);
    expect(transformed.xAxisPosition).toBe(controlByName('xAxisPosition').config.default);
    expect(transformed.showValues).toBe(controlByName('showValues').config.default);
    expect(transformed.valueFontSize).toBe(controlByName('valueFontSize').config.default);
    expect(transformed.showZeroValues).toBe(controlByName('showZeroValues').config.default);
    expect(transformed.showSmartAnnotations).toBe(controlByName('showSmartAnnotations').config.default);
    expect(transformed.smartAnnotationStyle).toBe(controlByName('smartAnnotationStyle').config.default);
    expect(transformed.showAnnotationLegend).toBe(controlByName('showAnnotationLegend').config.default);
    expect(transformed.showLegend).toBe(controlByName('showLegend').config.default);
    expect(transformed.legendPosition).toBe(controlByName('legendPosition').config.default);
    expect(transformed.showRowTotals).toBe(controlByName('showRowTotals').config.default);
    expect(transformed.showColumnTotals).toBe(controlByName('showColumnTotals').config.default);
    expect(transformed.totalLabel).toBe(controlByName('totalLabel').config.default);
    expect(transformed.totalAggregation).toBe(controlByName('totalAggregation').config.default);
    expect(transformed.showPercentages).toBe(controlByName('showPercentages').config.default);
    expect(transformed.emitFilter).toBe(controlByName('emitFilter').config.default);
    expect(transformed.time1Label).toBeUndefined();
    expect(transformed.time2Label).toBeUndefined();

    const withTime = transformProps({
      width: 800,
      height: 600,
      formData: {
        datasource: '1__table',
        viz_type: 'stratum_heatmap',
        xAxisDimension: 'GIORNO',
        yAxisDimension: 'ORA',
        metric: 'TEMPO_ATTESA',
      },
      queriesData: [
        {
          data: [{ GIORNO: 'Lunedì', ORA: '08:00', TEMPO_ATTESA: '00:10:00' }],
        },
      ],
    } as unknown as ChartProps);
    expect(withTime.timeFormat?.format).toBe(controlByName('timeDisplayFormat').config.default);
    expect(withTime.timeFormat?.fractionDigits).toBe(controlByName('timeFractionDigits').config.default);
  });
});
