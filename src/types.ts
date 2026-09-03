import {
  ChartProps,
  QueryFormData,
  DataRecord,
  BinaryQueryObjectFilterClause,
} from '@superset-ui/core';

export type VisualMapMode = 'continuous' | 'piecewise';

export interface StratumHeatmapFormData extends QueryFormData {
  xAxisDimension: string;
  yAxisDimension: string;
  metric: any;
  colorScheme?: string;
  linearColorScheme?: string;
  visualMapMode?: VisualMapMode;
  piecewiseBuckets?: number;
  showValues?: boolean;
  showPercentages?: boolean;
  autoContrastText?: boolean;
  cellRadius?: number;
  cellBorderWidth?: number;
  cellBorderColor?: string;
  showRowTotals?: boolean;
  showColumnTotals?: boolean;
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
}

export interface StratumHeatmapChartProps extends ChartProps {
  formData: StratumHeatmapFormData;
  queriesData: {
    data: DataRecord[];
  }[];
}

export interface StratumHeatmapTransformedProps {
  width: number;
  height: number;
  xCategories: string[];
  yCategories: string[];
  matrixData: [number, number, number | null, HeatmapCellData][];
  minValue: number;
  maxValue: number;
  visualMapMode: VisualMapMode;
  colorRange: string[];
  showValues: boolean;
  showPercentages: boolean;
  cellRadius: number;
  cellBorderWidth: number;
  cellBorderColor: string;
  autoContrastText: boolean;
  emitFilter: boolean;
  xAxisDimension: string;
  yAxisDimension: string;
  onCellClick?: (filter: { col: string; op: 'IN'; val: string[] }[]) => void;
  filterState?: {
    x?: string;
    y?: string;
  };
}
