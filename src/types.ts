import {
  ChartProps,
  QueryFormData,
  DataRecord,
} from '@superset-ui/core';

// 'legend' is the value of 0.3.0, kept so that saved charts still read: it means no mark on the cells
// and the legend on.
export type SmartAnnotationStyle = 'pin' | 'cell_badge' | 'none' | 'legend';
export type VisualMapMode = 'continuous' | 'piecewise';
export type HeatmapComparisonMode = 'none' | 'time_offsets' | 'dual_metric' | 'period_column';
export type DeltaDisplayType = 'absolute' | 'percentage' | 'both';
export type DeltaColorScale = 'bipolar_diverging' | 'sequential_standard' | 'polarity_inverted';

export interface StratumHeatmapFormData extends QueryFormData {
  xAxisDimension: string;
  yAxisDimension: string;
  metric: any;
  heatmap_comparison_mode?: HeatmapComparisonMode;
  comparison_metric?: any;
  time_1_label?: string;
  time_2_label?: string;
  delta_display_type?: DeltaDisplayType;
  delta_color_scale?: DeltaColorScale;
  zero_baseline_badge_label?: string;
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
  smartAnnotationStyle?: SmartAnnotationStyle;
  showAnnotationLegend?: boolean;
  smartAnnotationThreshold?: number | string | null;
  comparisonHighlight?: boolean;
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
  comparisonValue?: number | null;
  delta?: number | null;
  deltaPercent?: number | null;
  isZeroBaseline?: boolean;
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
  smartAnnotationStyle?: SmartAnnotationStyle;
  showAnnotationLegend?: boolean;
  smartAnnotationThreshold?: number;
  comparisonHighlight?: boolean;
  cellRadius: number;
  emitFilter: boolean;
  xAxisDimension: string;
  yAxisDimension: string;
  activeCell?: { x: string; y: string } | null;
  showRowTotals?: boolean;
  showColumnTotals?: boolean;
  totalLabel?: string;
  totalAggregation?: 'sum' | 'avg';
  heatmapComparisonMode?: HeatmapComparisonMode;
  comparisonMetric?: any;
  time1Label?: string;
  time2Label?: string;
  deltaDisplayType?: DeltaDisplayType;
  deltaColorScale?: DeltaColorScale;
  zeroBaselineBadgeLabel?: string;
  deltaMin?: number;
  deltaMax?: number;
  gridMapT1?: Map<string, number | null>;
  gridMapT2?: Map<string, number | null>;
  onCellClick?: (filter: { col: string; op: 'IN'; val: string[] }[]) => void;
  filterState?: {
    x?: string;
    y?: string;
    [key: string]: any;
  };
}

