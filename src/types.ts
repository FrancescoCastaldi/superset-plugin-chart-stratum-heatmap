import {
  ChartProps,
  QueryFormData,
  DataRecord,
} from '@superset-ui/core';

export type VisualMapMode = 'continuous' | 'piecewise';

export interface StratumHeatmapFormData extends QueryFormData {
  xAxisDimension: string;
  yAxisDimension: string;
  metric: any;
  colorScheme?: string;
  linearColorScheme?: string;
  reversePalette?: boolean;
  customMinValue?: number | null;
  customMaxValue?: number | null;
  visualMapMode?: VisualMapMode;
  piecewiseBuckets?: number;
  showLegend?: boolean;
  legendPosition?: 'bottom' | 'top' | 'right';
  xAxisPosition?: 'top' | 'bottom';
  showValues?: boolean;
  valueFontSize?: number;
  showZeroValues?: boolean;
  zeroCellNeutral?: boolean;
  showPercentages?: boolean;
  showSmartAnnotations?: boolean;
  cellRadius?: number;
  showRowTotals?: boolean;
  showColumnTotals?: boolean;
  totalLabel?: string;
  totalAggregation?: 'sum' | 'avg';
  totalsBackgroundColor?: string;
  emitFilter?: boolean;
  smartSort?: boolean;
  yAxisSortAsc?: boolean;
  xAxisSortAsc?: boolean;
  nullValueColor?: string;
  zeroValueColor?: string;
}

export interface HeatmapCellData {
  xValue: string;
  yValue: string;
  xIndex: number;
  yIndex: number;
  value: number | null;
  formattedValue: string;
  rowTotal: number;
  colTotal: number;
  grandTotal: number;
  rowPercentage: number;
  colPercentage: number;
  totalPercentage: number;
  isRowTotal?: boolean;
  isColTotal?: boolean;
  isGrandTotal?: boolean;
}

export interface StratumHeatmapChartProps extends ChartProps {
  formData: StratumHeatmapFormData;
  queriesData: {
    data: DataRecord[];
  }[];
}

export interface HeatmapDatum {
  value: [number, number, number | null, HeatmapCellData];
  label?: {
    color?: string;
    fontSize?: number;
    show?: boolean;
  };
  itemStyle?: {
    color?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    shadowBlur?: number;
    shadowColor?: string;
  };
}

export interface StratumHeatmapTransformedProps {
  width: number;
  height: number;
  xCategories: string[];
  yCategories: string[];
  matrixData: (HeatmapDatum | [number, number, number | null, HeatmapCellData])[];
  minValue: number;
  maxValue: number;
  visualMapMode: VisualMapMode;
  piecewiseBuckets?: number;
  showLegend?: boolean;
  legendPosition?: 'bottom' | 'top' | 'right';
  xAxisPosition?: 'top' | 'bottom';
  xAxisLabelRotation?: number;
  colorRange: string[];
  showValues: boolean;
  valueFontSize: number;
  showZeroValues: boolean;
  zeroCellNeutral: boolean;
  showPercentages: boolean;
  showSmartAnnotations: boolean;
  cellRadius: number;
  emitFilter: boolean;
  xAxisDimension: string;
  yAxisDimension: string;
  activeCell?: { x: string; y: string } | null;
  showRowTotals?: boolean;
  showColumnTotals?: boolean;
  totalLabel?: string;
  totalAggregation?: 'sum' | 'avg';
  onCellClick?: (filter: { col: string; op: 'IN'; val: string[] }[]) => void;
  filterState?: {
    x?: string;
    y?: string;
    [key: string]: any;
  };
}

