import { StratumHeatmapTransformedProps } from '../types';
import { buildHeatmapOption } from './buildHeatmapOption';

/**
 * Opzioni ECharts a partire dalle props del componente. Funzione pura: il test passa dallo stesso
 * percorso del grafico, formati compresi, senza montare React.
 */
export function heatmapOptionFromProps(props: StratumHeatmapTransformedProps) {
  const {
    width, height, xCategories, yCategories, matrixData, minValue, maxValue, visualMapMode,
    piecewiseBuckets = 5, showLegend = true, legendPosition = 'bottom', xAxisPosition = 'top',
    colorRange, showValues, valueFontSize = 11, showZeroValues = false, zeroCellNeutral = true,
    showPercentages, showSmartAnnotations = true, smartAnnotationStyle = 'pin',
    showAnnotationLegend = false, smartAnnotationThreshold, comparisonHighlight = false,
    deltaDisplayType, deltaColorScale, deltaMax = 0, zeroBaselineBadgeLabel, cellRadius,
    xAxisDimension, yAxisDimension, activeCell, totalLabel = 'Total', time1Label, time2Label,
    numberFormat, timeFormat,
  } = props;

  return buildHeatmapOption({
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
    smartAnnotationStyle,
    showAnnotationLegend,
    smartAnnotationThreshold,
    comparisonHighlight,
    deltaDisplayType,
    deltaColorScale,
    maxAbsDelta: deltaMax,
    zeroBaselineBadgeLabel,
    width,
    height,
    cellRadius,
    activeCell,
    totalLabel,
    xAxisDimension,
    yAxisDimension,
    time1Label,
    time2Label,
    numberFormat,
    timeFormat,
  })
}

