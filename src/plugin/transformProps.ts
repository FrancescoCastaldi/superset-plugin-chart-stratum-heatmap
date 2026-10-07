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
import {
  createCellClickHandler,
  resolveActiveCell,
} from './eventHandlers';

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
    xAxisPosition = 'top',
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
    showSmartAnnotations = true,
    cellRadius = 4,
    emitFilter = true,
    smartSort = true,
    xAxisSortAsc = true,
    yAxisSortAsc = true,
    showRowTotals = true,
    showColumnTotals = true,
    totalLabel = 'Totale',
    totalAggregation = 'sum',
    totalsBackgroundColor = '#f1f5f9',
  } = fd;

  // Risoluzione metrica
  const metricName =
    typeof metric === 'string'
      ? metric
      : metric?.label || metric?.column?.column_name || Object.keys(data[0] || {})[2] || 'value';

  // 1. Estrazione categorie uniche (escludendo eventuale etichetta totale da dati grezzi)
  const rawXCategories = Array.from(
    new Set(data.map(d => String(d[xAxisDimension] ?? '(vuoto)'))),
  ).filter(cat => cat !== totalLabel);
  const rawYCategories = Array.from(
    new Set(data.map(d => String(d[yAxisDimension] ?? '(vuoto)'))),
  ).filter(cat => cat !== totalLabel);

  // 2. Ordinamento intelligente o naturale
  const xCategoriesSorted = smartSort
    ? smartSortCategories(rawXCategories, xAxisSortAsc)
    : rawXCategories;
  const yCategoriesSorted = smartSort
    ? smartSortCategories(rawYCategories, yAxisSortAsc)
    : rawYCategories;

  // Categorie finali (con colonna/riga Totale in coda se abilitate)
  const xCategories = showRowTotals
    ? [...xCategoriesSorted, totalLabel]
    : xCategoriesSorted;
  const yCategories = showColumnTotals
    ? [...yCategoriesSorted, totalLabel]
    : yCategoriesSorted;

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
    if (xVal === totalLabel || yVal === totalLabel) return;

    const rawNum = d[metricName];
    const val = typeof rawNum === 'number' ? rawNum : Number(rawNum) || 0;

    const key = `${xVal}___${yVal}`;
    gridMap.set(key, val);

    rowTotals.set(yVal, (rowTotals.get(yVal) || 0) + val);
    colTotals.set(xVal, (colTotals.get(xVal) || 0) + val);
    grandTotal += val;

    // FONDAMENTALE: la scala colori si calcola SOLO sui valori reali delle celle
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

  // 5. Risoluzione activeCell da filterState Superset (logica pura in plugin/eventHandlers.ts)
  const activeCell = resolveActiveCell(filterState, xAxisDimension, yAxisDimension, totalLabel);

  // 6. Mappatura finale per ECharts Matrix con contrasto WCAG e gestione celle totali
  const valRange = maxValue - minValue || 1;
  const matrixData: HeatmapDatum[] = [];
  const dataXCount = xCategoriesSorted.length;
  const dataYCount = yCategoriesSorted.length;

  // 6.1 Celle dati ordinarie
  xCategoriesSorted.forEach((xVal, xIdx) => {
    yCategoriesSorted.forEach((yVal, yIdx) => {
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
          borderColor: '#ffffff',
          borderWidth: 1,
        },
        label: {
          color: optimalTextColor,
          fontSize: valueFontSize,
          show: showValues && (val > 0 || showZeroValues),
        },
      });
    });
  });

  // 6.2 Colonna Totali di Riga (posta a xIdx = dataXCount)
  if (showRowTotals) {
    const totalXIdx = dataXCount;
    yCategoriesSorted.forEach((yVal, yIdx) => {
      const sumVal = rowTotals.get(yVal) || 0;
      const val = totalAggregation === 'avg' ? (dataXCount > 0 ? sumVal / dataXCount : 0) : sumVal;

      const cellMeta: HeatmapCellData = {
        xValue: totalLabel,
        yValue: yVal,
        xIndex: totalXIdx,
        yIndex: yIdx,
        value: val,
        formattedValue: formatMetricValue(val, 'SMART_NUMBER'),
        rowTotal: sumVal,
        colTotal: 0,
        grandTotal,
        rowPercentage: 100,
        colPercentage: 0,
        totalPercentage: grandTotal > 0 ? (sumVal / grandTotal) * 100 : 0,
        isRowTotal: true,
      };

      matrixData.push({
        value: [totalXIdx, yIdx, val, cellMeta],
        itemStyle: {
          color: totalsBackgroundColor,
          borderColor: '#94a3b8',
          borderWidth: 2,
        },
        label: {
          color: '#0f172a',
          fontSize: valueFontSize,
          show: showValues,
        },
      });
    });
  }

  // 6.3 Riga Totali di Colonna (posta a yIdx = dataYCount)
  if (showColumnTotals) {
    const totalYIdx = dataYCount;
    xCategoriesSorted.forEach((xVal, xIdx) => {
      const sumVal = colTotals.get(xVal) || 0;
      const val = totalAggregation === 'avg' ? (dataYCount > 0 ? sumVal / dataYCount : 0) : sumVal;

      const cellMeta: HeatmapCellData = {
        xValue: xVal,
        yValue: totalLabel,
        xIndex: xIdx,
        yIndex: totalYIdx,
        value: val,
        formattedValue: formatMetricValue(val, 'SMART_NUMBER'),
        rowTotal: 0,
        colTotal: sumVal,
        grandTotal,
        rowPercentage: 0,
        colPercentage: 100,
        totalPercentage: grandTotal > 0 ? (sumVal / grandTotal) * 100 : 0,
        isColTotal: true,
      };

      matrixData.push({
        value: [xIdx, totalYIdx, val, cellMeta],
        itemStyle: {
          color: totalsBackgroundColor,
          borderColor: '#94a3b8',
          borderWidth: 2,
        },
        label: {
          color: '#0f172a',
          fontSize: valueFontSize,
          show: showValues,
        },
      });
    });
  }

  // 6.4 Cella Incrocio Totale Generale (Grand Total)
  if (showRowTotals && showColumnTotals) {
    const totalXIdx = dataXCount;
    const totalYIdx = dataYCount;
    const totalCells = dataXCount * dataYCount;
    const val = totalAggregation === 'avg' ? (totalCells > 0 ? grandTotal / totalCells : 0) : grandTotal;

    const cellMeta: HeatmapCellData = {
      xValue: totalLabel,
      yValue: totalLabel,
      xIndex: totalXIdx,
      yIndex: totalYIdx,
      value: val,
      formattedValue: formatMetricValue(val, 'SMART_NUMBER'),
      rowTotal: grandTotal,
      colTotal: grandTotal,
      grandTotal,
      rowPercentage: 100,
      colPercentage: 100,
      totalPercentage: 100,
      isGrandTotal: true,
    };

    matrixData.push({
      value: [totalXIdx, totalYIdx, val, cellMeta],
      itemStyle: {
        color: '#e2e8f0',
        borderColor: '#475569',
        borderWidth: 2,
      },
      label: {
        color: '#0f172a',
        fontSize: valueFontSize + 1,
        show: showValues,
      },
    });
  }

  // 7. Handler per Cross-Filtering verso Superset Dashboard con supporto totali monodimensionali
  // (logica pura di toggle/selezione in plugin/eventHandlers.ts)
  const onCellClick = createCellClickHandler({
    emitFilter,
    setDataMask: hooks?.setDataMask as ((dataMask: any) => void) | undefined,
    xAxisDimension,
    yAxisDimension,
    totalLabel,
    activeCell,
  });

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
    xAxisPosition,
    colorRange,
    showValues,
    valueFontSize,
    showZeroValues,
    zeroCellNeutral,
    showPercentages,
    showSmartAnnotations,
    cellRadius,
    emitFilter,
    xAxisDimension,
    yAxisDimension,
    activeCell,
    showRowTotals,
    showColumnTotals,
    totalLabel,
    totalAggregation,
    onCellClick,
    filterState: filterState as any,
  };
}
