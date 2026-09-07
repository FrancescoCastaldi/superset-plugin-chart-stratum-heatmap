import { describe, it, expect, vi } from 'vitest';
import transformProps from '../src/plugin/transformProps';
import { ChartProps } from '@superset-ui/core';

describe('transformProps', () => {
  const sampleData = [
    { GIORNO: 'Lunedì', ORA: '08:00', CONTEGGIO: 10 },
    { GIORNO: 'Lunedì', ORA: '09:00', CONTEGGIO: 40 },
    { GIORNO: 'Martedì', ORA: '08:00', CONTEGGIO: 20 },
    { GIORNO: 'Martedì', ORA: '09:00', CONTEGGIO: 30 },
  ];

  const defaultChartProps: Partial<ChartProps> = {
    width: 800,
    height: 600,
    formData: {
      datasource: '1__table',
      viz_type: 'stratum_heatmap',
      xAxisDimension: 'GIORNO',
      yAxisDimension: 'ORA',
      metric: 'CONTEGGIO',
      visualMapMode: 'continuous',
      piecewiseBuckets: 5,
      xAxisLabelRotation: 45,
      linearColorScheme: 'wavesOfBlue',
      showValues: true,
      showPercentages: true,
      autoContrastText: true,
      cellRadius: 4,
      cellBorderWidth: 2,
      emitFilter: true,
      smartSort: true,
      xAxisSortAsc: true,
      yAxisSortAsc: true,
    },
    queriesData: [
      {
        data: sampleData,
      },
    ],
  };

  it('correctly extracts and sorts X and Y categories using smartSort', () => {
    const unorderedData = [
      { GIORNO: 'Venerdì', ORA: '14:00', CONTEGGIO: 5 },
      { GIORNO: 'Lunedì', ORA: '08:00', CONTEGGIO: 10 },
      { GIORNO: 'Martedì', ORA: '09:00', CONTEGGIO: 20 },
    ];

    const props = {
      ...defaultChartProps,
      queriesData: [{ data: unorderedData }],
    } as unknown as ChartProps;

    const transformed = transformProps(props);

    expect(transformed.xCategories).toEqual(['Lunedì', 'Martedì', 'Venerdì']);
    expect(transformed.yCategories).toEqual(['08:00', '09:00', '14:00']);
  });

  it('applies the chosen color scheme correctly', () => {
    const props = {
      ...defaultChartProps,
      formData: {
        ...defaultChartProps.formData,
        linearColorScheme: 'emeraldHeat',
      },
    } as unknown as ChartProps;

    const transformed = transformProps(props);
    expect(transformed.colorRange).toEqual(['#f0fff4', '#9ae6b4', '#38a169', '#1c4532']);
  });

  it('calculates row totals, column totals, and grandTotal accurately', () => {
    const props = {
      ...defaultChartProps,
    } as unknown as ChartProps;

    const transformed = transformProps(props);

    expect(transformed.minValue).toBe(10);
    expect(transformed.maxValue).toBe(40);

    // Total elements: 2 days x 2 hours = 4 cells
    expect(transformed.matrixData).toHaveLength(4);

    // Grand total: 10 + 40 + 20 + 30 = 100
    transformed.matrixData.forEach(item => {
      const datum = item as any;
      const meta = datum.value[3];
      expect(meta.grandTotal).toBe(100);
    });

    // Lunedì col total: 10 + 40 = 50
    // Martedì col total: 20 + 30 = 50
    // 08:00 row total: 10 + 20 = 30
    // 09:00 row total: 40 + 30 = 70
    const cellLun08 = (transformed.matrixData as any[]).find(
      d => d.value[3].xValue === 'Lunedì' && d.value[3].yValue === '08:00',
    );
    expect(cellLun08).toBeDefined();
    expect(cellLun08.value[3].value).toBe(10);
    expect(cellLun08.value[3].colTotal).toBe(50);
    expect(cellLun08.value[3].rowTotal).toBe(30);
    expect(cellLun08.value[3].colPercentage).toBeCloseTo((10 / 50) * 100, 2);
    expect(cellLun08.value[3].rowPercentage).toBeCloseTo((10 / 30) * 100, 2);
    expect(cellLun08.value[3].totalPercentage).toBeCloseTo((10 / 100) * 100, 2);
  });

  it('assigns auto WCAG contrast text colors based on cell background intensity', () => {
    const props = {
      ...defaultChartProps,
      formData: {
        ...defaultChartProps.formData,
        autoContrastText: true,
      },
    } as unknown as ChartProps;

    const transformed = transformProps(props);

    // Minimum value cell (val 10, normalized 0 -> lightest color '#eef4f9') -> dark text '#1c3d5e'
    const minCell = (transformed.matrixData as any[]).find(d => d.value[2] === 10);
    expect(minCell.label.color).toBe('#1c3d5e');

    // Maximum value cell (val 40, normalized 1 -> darkest color '#1c3d5e') -> light text '#ffffff'
    const maxCell = (transformed.matrixData as any[]).find(d => d.value[2] === 40);
    expect(maxCell.label.color).toBe('#ffffff');
  });

  it('extracts activeCell from filterState and sets up cross-filter handler', () => {
    const mockSetDataMask = vi.fn();
    const props = {
      ...defaultChartProps,
      hooks: {
        setDataMask: mockSetDataMask,
      },
      filterState: {
        activeCell: { x: 'Lunedì', y: '08:00' },
      },
    } as unknown as ChartProps;

    const transformed = transformProps(props);

    expect(transformed.activeCell).toEqual({ x: 'Lunedì', y: '08:00' });

    // Test toggle off when clicking on the already active cell
    transformed.onCellClick?.([
      { col: 'GIORNO', op: 'IN', val: ['Lunedì'] },
      { col: 'ORA', op: 'IN', val: ['08:00'] },
    ]);

    expect(mockSetDataMask).toHaveBeenCalledWith({
      extraFormData: {
        filters: [],
      },
      filterState: {
        value: null,
        activeCell: null,
        filters: [],
      },
    });

    // Test selecting a new cell
    transformed.onCellClick?.([
      { col: 'GIORNO', op: 'IN', val: ['Martedì'] },
      { col: 'ORA', op: 'IN', val: ['09:00'] },
    ]);

    expect(mockSetDataMask).toHaveBeenCalledWith({
      extraFormData: {
        filters: [
          { col: 'GIORNO', op: 'IN', val: ['Martedì'] },
          { col: 'ORA', op: 'IN', val: ['09:00'] },
        ],
      },
      filterState: {
        value: ['Martedì', '09:00'],
        activeCell: { x: 'Martedì', y: '09:00' },
        filters: [
          { col: 'GIORNO', op: 'IN', val: ['Martedì'] },
          { col: 'ORA', op: 'IN', val: ['09:00'] },
        ],
      },
    });
  });

  it('handles metric defined as AdhocMetric object or column object', () => {
    const props = {
      ...defaultChartProps,
      formData: {
        ...defaultChartProps.formData,
        metric: {
          label: 'sum__CONTEGGIO',
        },
      },
      queriesData: [
        {
          data: [{ GIORNO: 'Lunedì', ORA: '08:00', sum__CONTEGGIO: 15 }],
        },
      ],
    } as unknown as ChartProps;

    const transformed = transformProps(props);
    expect(transformed.matrixData).toHaveLength(1);
    expect((transformed.matrixData[0] as any).value[2]).toBe(15);
  });
});
