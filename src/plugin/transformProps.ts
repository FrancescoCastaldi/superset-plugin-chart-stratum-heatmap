import { ChartProps, DataRecord } from '@superset-ui/core';
import {
  StratumHeatmapFormData,
  StratumHeatmapTransformedProps,
  HeatmapCellData,
  VisualMapMode,
} from '../types';
import { smartSortCategories } from '../utils/sorters';
import { formatMetricValue } from '../utils/formatting';

export default function transformProps(chartProps: ChartProps): StratumHeatmapTransformedProps {
  const { width, height, formData, queriesData, hooks, filterState } = chartProps;
  const fd = formData as StratumHeatmapFormData;
  const data = (queriesData[0]?.data || []) as DataRecord[];

  const {
    xAxisDimension = 'GIORNO_CONTATTO',
    yAxisDimension = 'ORA_CONTATTO',
    metric,
    visualMapMode = 'continuous' as VisualMapMode,
    linearColorScheme,
    colorScheme,
    showValues = true,
    showPercentages = true,
    autoContrastText = true,
    cellRadius = 4,
    cellBorderWidth = 2,
    cellBorderColor = '#ffffff',
    emitFilter = true,
    smartSort = true,
    xAxisSortAsc = true,
    yAxisSortAsc = true,
  } = fd;

  // Risoluzione metrica
  const metricName =
    typeof metric === 'string'
      ? metric
      : metric?.label || metric?.column?.column_name || Object.keys(data[0] || {})[2] || 'value';

  // 1. Estrazione categorie uniche
  const rawXCategories = Array.from(
    new Set(data.map(d => String(d[xAxisDimension] ?? '(vuoto)'))),
  );
  const rawYCategories = Array.from(
    new Set(data.map(d => String(d[yAxisDimension] ?? '(vuoto)'))),
  );

  // 2. Ordinamento intelligente o naturale
  const xCategories = smartSort
    ? smartSortCategories(rawXCategories, xAxisSortAsc)
    : rawXCategories;
  const yCategories = smartSort
    ? smartSortCategories(rawYCategories, yAxisSortAsc)
    : rawYCategories;

  const xMap = new Map<string, number>(xCategories.map((c, i) => [c, i]));
  const yMap = new Map<string, number>(yCategories.map((c, i) => [c, i]));

  // 3. Costruzione griglia per calcolo totali
  const gridMap = new Map<string, number>();
  const rowTotals = new Map<string, number>();
  const colTotals = new Map<string, number>();
  let grandTotal = 0;
  let minValue = Infinity;
  let maxValue = -Infinity;

  data.forEach(d => {
    const xVal = String(d[xAxisDimension] ?? '(vuoto)');
    const yVal = String(d[yAxisDimension] ?? '(vuoto)');
    const rawNum = d[metricName];
    const val = typeof rawNum === 'number' ? rawNum : Number(rawNum) || 0;

    const key = `${xVal}___${yVal}`;
    gridMap.set(key, val);

    rowTotals.set(yVal, (rowTotals.get(yVal) || 0) + val);
    colTotals.set(xVal, (colTotals.get(xVal) || 0) + val);
    grandTotal += val;

    if (val < minValue) minValue = val;
    if (val > maxValue) maxValue = val;
  });

  if (minValue === Infinity) minValue = 0;
  if (maxValue === -Infinity) maxValue = 1;

  // 4. Mappatura finale per ECharts Matrix
  const matrixData: [number, number, number | null, HeatmapCellData][] = [];

  xCategories.forEach((xVal, xIdx) => {
    yCategories.forEach((yVal, yIdx) => {
      const key = `${xVal}___${yVal}`;
      const val = gridMap.has(key) ? (gridMap.get(key) as number) : 0;
      const rTot = rowTotals.get(yVal) || 0;
      const cTot = colTotals.get(xVal) || 0;

      const cellMeta: HeatmapCellData = {
        xValue: xVal,
        yValue: yVal,
        xIndex: xIdx,
        yIndex: yIdx,
        value: val,
        formattedValue: formatMetricValue(val, 'SMART_NUMBER'),
        rowTotal: rTot,
        colTotal: cTot,
        grandTotal,
        rowPercentage: rTot > 0 ? (val / rTot) * 100 : 0,
        colPercentage: cTot > 0 ? (val / cTot) * 100 : 0,
        totalPercentage: grandTotal > 0 ? (val / grandTotal) * 100 : 0,
      };

      matrixData.push([xIdx, yIdx, val, cellMeta]);
    });
  });

  // 5. Palette colori predefinita (Waves of Blue)
  const defaultColors = ['#eef4f9', '#bcd5ea', '#7aa8cf', '#3a6a9b', '#1c3d5e'];
  const colorRange = defaultColors;

  // Handler per Cross-Filtering verso Superset Dashboard
  const onCellClick = (filters: { col: string; op: 'IN'; val: string[] }[]) => {
    if (emitFilter && hooks?.setDataMask) {
      hooks.setDataMask({
        extraFormData: {
          filters,
        },
        filterState: {
          value: filters.map(f => f.val[0]),
        },
      });
    }
  };

  return {
    width,
    height,
    xCategories,
    yCategories,
    matrixData,
    minValue,
    maxValue,
    visualMapMode,
    colorRange,
    showValues,
    showPercentages,
    cellRadius,
    cellBorderWidth,
    cellBorderColor,
    autoContrastText,
    emitFilter,
    xAxisDimension,
    yAxisDimension,
    onCellClick,
    filterState: filterState as any,
  };
}
