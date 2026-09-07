import { ChartProps, DataRecord } from '@superset-ui/core';
import {
  StratumHeatmapFormData,
  StratumHeatmapTransformedProps,
  HeatmapCellData,
  HeatmapDatum,
  VisualMapMode,
} from '../types';
import { smartSortCategories } from '../utils/sorters';
import { formatMetricValue } from '../utils/formatting';
import { getOptimalTextColor, interpolateColor } from '../utils/contrast';

const COLOR_SCHEMES: Record<string, string[]> = {
  wavesOfBlue: ['#eef4f9', '#bcd5ea', '#7aa8cf', '#3a6a9b', '#1c3d5e'],
  supersetColors: ['#f0f4f8', '#90cdf4', '#3182ce', '#1a365d'],
  emeraldHeat: ['#f0fff4', '#9ae6b4', '#38a169', '#1c4532'],
  sunsetWarm: ['#fffaf0', '#fbd38d', '#ed8936', '#9c4221'],
};

export default function transformProps(chartProps: ChartProps): StratumHeatmapTransformedProps {
  const { width, height, formData, queriesData, hooks, filterState } = chartProps;
  const fd = formData as StratumHeatmapFormData;
  const data = (queriesData[0]?.data || []) as DataRecord[];

  const {
    xAxisDimension = 'GIORNO_CONTATTO',
    yAxisDimension = 'ORA_CONTATTO',
    metric,
    visualMapMode = 'continuous' as VisualMapMode,
    piecewiseBuckets = 5,
    showLegend = true,
    legendPosition = 'bottom',
    xAxisLabelRotation = 0,
    linearColorScheme,
    colorScheme,
    reversePalette = false,
    customMinValue,
    customMaxValue,
    showValues = true,
    valueFontSize = 11,
    showZeroValues = false,
    zeroCellNeutral = true,
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

  // 3. Risoluzione palette colori predefinita o dinamica
  const chosenScheme = linearColorScheme || colorScheme || 'wavesOfBlue';
  let colorRange = (COLOR_SCHEMES[chosenScheme] || COLOR_SCHEMES.wavesOfBlue).slice();
  if (reversePalette) {
    colorRange = colorRange.reverse();
  }

  // 4. Costruzione griglia per calcolo totali
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

  // Override manuale min/max se specificato
  if (customMinValue !== undefined && customMinValue !== null && !isNaN(Number(customMinValue))) {
    minValue = Number(customMinValue);
  }
  if (customMaxValue !== undefined && customMaxValue !== null && !isNaN(Number(customMaxValue))) {
    maxValue = Number(customMaxValue);
  }

  // 5. Risoluzione activeCell da filterState Superset
  let activeCell: { x: string; y: string } | null = null;
  const fs: any = filterState;
  if (fs) {
    if (fs.activeCell && fs.activeCell.x && fs.activeCell.y) {
      activeCell = fs.activeCell;
    } else if (fs.x && fs.y) {
      activeCell = { x: String(fs.x), y: String(fs.y) };
    } else if (Array.isArray(fs.filters) && fs.filters.length >= 2) {
      const xFilter = fs.filters.find((f: any) => f.col === xAxisDimension);
      const yFilter = fs.filters.find((f: any) => f.col === yAxisDimension);
      if (xFilter?.val?.[0] && yFilter?.val?.[0]) {
        activeCell = { x: String(xFilter.val[0]), y: String(yFilter.val[0]) };
      }
    } else if (Array.isArray(fs.value) && fs.value.length >= 2) {
      activeCell = { x: String(fs.value[0]), y: String(fs.value[1]) };
    }
  }

  // 6. Mappatura finale per ECharts Matrix con contrasto WCAG per-datum
  const valRange = maxValue - minValue || 1;
  const matrixData: HeatmapDatum[] = [];

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

      const normalized = Math.max(0, Math.min(1, (val - minValue) / valRange));
      const cellBg =
        val === 0 && zeroCellNeutral
          ? '#f1f5f9'
          : interpolateColor(colorRange, normalized);
      const optimalTextColor = getOptimalTextColor(cellBg);

      matrixData.push({
        value: [xIdx, yIdx, val, cellMeta],
        itemStyle: {
          color: cellBg,
        },
        label: {
          color: autoContrastText ? optimalTextColor : '#1c3d5e',
          fontSize: valueFontSize,
          show: showValues && (val > 0 || showZeroValues),
        },
      });
    });
  });

  // 7. Handler per Cross-Filtering verso Superset Dashboard con supporto toggle deselezione
  const onCellClick = (filters: { col: string; op: 'IN'; val: string[] }[]) => {
    if (!emitFilter || !hooks?.setDataMask) return;

    if (!filters || filters.length === 0) {
      hooks.setDataMask({
        extraFormData: {
          filters: [],
        },
        filterState: {
          value: null,
          activeCell: null,
          filters: [],
        },
      });
      return;
    }

    const clickedX = filters.find(f => f.col === xAxisDimension)?.val[0];
    const clickedY = filters.find(f => f.col === yAxisDimension)?.val[0];

    // Se la cella cliccata è già attiva, deseleziona (toggle off)
    if (
      activeCell &&
      clickedX !== undefined &&
      clickedY !== undefined &&
      String(activeCell.x) === String(clickedX) &&
      String(activeCell.y) === String(clickedY)
    ) {
      hooks.setDataMask({
        extraFormData: {
          filters: [],
        },
        filterState: {
          value: null,
          activeCell: null,
          filters: [],
        },
      });
      return;
    }

    hooks.setDataMask({
      extraFormData: {
        filters,
      },
      filterState: {
        value: filters.map(f => f.val[0]),
        activeCell: clickedX !== undefined && clickedY !== undefined ? { x: clickedX, y: clickedY } : null,
        filters,
      },
    });
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
    piecewiseBuckets,
    showLegend,
    legendPosition,
    xAxisLabelRotation,
    colorRange,
    showValues,
    valueFontSize,
    showZeroValues,
    zeroCellNeutral,
    showPercentages,
    cellRadius,
    cellBorderWidth,
    cellBorderColor,
    autoContrastText,
    emitFilter,
    xAxisDimension,
    yAxisDimension,
    activeCell,
    onCellClick,
    filterState: filterState as any,
  };
}

