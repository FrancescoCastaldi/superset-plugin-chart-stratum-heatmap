/**
 * Assemblaggio puro dell'opzione ECharts di StratumHeatmap.
 *
 * Estratto verbatim (nessuna modifica di logica) dal `useMemo` di
 * `components/StratumHeatmap.tsx`: riceve le props gia' trasformate e restituisce
 * l'oggetto opzione completo (visualMap, griglia, assi, serie heatmap, tooltip).
 */
import { HeatmapCellData, HeatmapDatum, VisualMapMode } from '../types';
import { formatPercentage, formatMetricValue } from '../utils/formatting';

export interface HeatmapOptionParams {
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
  colorRange: string[];
  showValues?: boolean;
  valueFontSize?: number;
  showZeroValues?: boolean;
  zeroCellNeutral?: boolean;
  showPercentages?: boolean;
  showSmartAnnotations?: boolean;
  cellRadius?: number;
  activeCell?: { x: string; y: string } | null;
  totalLabel?: string;
  xAxisDimension: string;
  yAxisDimension: string;
  time1Label?: string;
  time2Label?: string;
}

export function buildHeatmapOption(params: HeatmapOptionParams): any {
  const {
    xCategories,
    yCategories,
    matrixData,
    minValue,
    maxValue,
    visualMapMode,
    piecewiseBuckets = 5,
    showLegend = true,
    legendPosition = 'bottom',
    xAxisPosition = 'top',
    colorRange,
    showValues,
    valueFontSize = 11,
    showZeroValues = false,
    showPercentages,
    showSmartAnnotations = true,
    cellRadius,
    activeCell,
    totalLabel = 'Totale',
    xAxisDimension,
    yAxisDimension,
  } = params;

  // Configurazione visualMap (Continua vs Piecewise) con fix dimension = 2
  const visualMapConfig: any = {
    show: showLegend,
    dimension: 2, // FONDAMENTALE: mappa l'indice 2 (valore) e non l'indice 3 (oggetto meta)
    min: minValue,
    max: maxValue,
    calculable: visualMapMode === 'continuous',
    orient: legendPosition === 'right' ? 'vertical' : 'horizontal',
    left: legendPosition === 'right' ? 'right' : 'center',
    bottom: legendPosition === 'bottom' ? 8 : undefined,
    top: legendPosition === 'top' ? 8 : (legendPosition === 'right' ? 'center' : undefined),
    inRange: {
      color: colorRange,
    },
    textStyle: {
      color: '#475569',
      fontSize: 11,
    },
  };

  if (visualMapMode === 'piecewise') {
    visualMapConfig.type = 'piecewise';
    visualMapConfig.splitNumber = piecewiseBuckets;
  } else {
    visualMapConfig.type = 'continuous';
  }

  // Normalizzazione dati serie ECharts con evidenziazione cella attiva e preservazione stile totali
  const seriesData = matrixData.map(item => {
    let coords: [number, number, number | null, HeatmapCellData];
    let labelColor: string | undefined;
    let labelFontWeight: any;
    let cellColor: string | undefined;
    let customItemStyle: any = {};

    if (Array.isArray(item)) {
      coords = item;
    } else {
      coords = item.value;
      labelColor = item.label?.color;
      labelFontWeight = (item.label as any)?.fontWeight;
      cellColor = item.itemStyle?.color;
      customItemStyle = item.itemStyle || {};
    }

    const meta = coords[3];
    const isSelected =
      Boolean(activeCell) &&
      activeCell?.x !== undefined &&
      activeCell?.y !== undefined &&
      meta &&
      String(activeCell.x) === String(meta.xValue) &&
      String(activeCell.y) === String(meta.yValue);

    const datum: any = {
      value: coords,
      itemStyle: {
        borderRadius: cellRadius,
        borderColor: customItemStyle.borderColor || '#ffffff',
        borderWidth: customItemStyle.borderWidth !== undefined ? customItemStyle.borderWidth : 1,
        ...customItemStyle,
      },
    };

    // Doppio meccanismo di sicurezza: colorazione esplicita per cella se presente
    if (cellColor) {
      datum.itemStyle.color = cellColor;
    }

    if (labelColor || labelFontWeight) {
      datum.label = {
        color: labelColor,
        fontWeight: labelFontWeight || 600,
      };
    }

    if (isSelected) {
      datum.itemStyle = {
        ...datum.itemStyle,
        borderColor: '#0284c7',
        borderWidth: 3,
        shadowBlur: 8,
        shadowColor: 'rgba(2, 132, 199, 0.6)',
      };
    }

    return datum;
  });

  // Calcolo celle Min e Max reali per Smart Annotations (escludendo i totali di riga, colonna e generale)
  let maxVal = -Infinity;
  let minVal = Infinity;
  let maxCellCoords: [number, number] | null = null;
  let minCellCoords: [number, number] | null = null;
  let maxCellMeta: HeatmapCellData | undefined;
  let minCellMeta: HeatmapCellData | undefined;

  for (const item of matrixData) {
    const coords: [number, number, number | null, HeatmapCellData] = Array.isArray(item) ? item : item.value;
    if (!coords) continue;
    const meta = coords[3];
    if (meta?.isRowTotal || meta?.isColTotal || meta?.isGrandTotal) continue;
    if (totalLabel && (meta?.xValue === totalLabel || meta?.yValue === totalLabel)) continue;

    const val = coords[2];
    if (val === null || val === undefined || isNaN(val)) continue;

    if (val > maxVal) {
      maxVal = val;
      maxCellCoords = [coords[0], coords[1]];
      maxCellMeta = meta;
    }
    if (val < minVal) {
      minVal = val;
      minCellCoords = [coords[0], coords[1]];
      minCellMeta = meta;
    }
  }

  const smartAnnotationData: any[] = [];
  if (maxCellCoords !== null) {
    smartAnnotationData.push({
      name: 'Max',
      coord: maxCellCoords,
      value: maxVal,
      meta: maxCellMeta,
    });
  }
  if (minCellCoords !== null && (maxCellCoords === null || minCellCoords[0] !== maxCellCoords[0] || minCellCoords[1] !== maxCellCoords[1])) {
    smartAnnotationData.push({
      name: 'Min',
      coord: minCellCoords,
      value: minVal,
      meta: minCellMeta,
    });
  }

  const isTopX = xAxisPosition === 'top';
  const gridBottom = !showLegend ? (isTopX ? 16 : 32) : (legendPosition === 'bottom' ? 65 : (isTopX ? 16 : 32));
  const gridTop = showLegend && legendPosition === 'top' ? 65 : (isTopX ? 65 : 24);
  const gridRight = showLegend && legendPosition === 'right' ? 80 : 35;

  return {
    tooltip: {
      position: 'top',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderColor: '#334155',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: {
        color: '#ffffff',
        fontSize: 12,
      },
      formatter: (params: any) => {
        if (params.componentType === 'markPoint') {
          const isMax = params.data?.name === 'Max';
          const badgeTitle = isMax ? '🏆 Valore Massimo' : '📉 Valore Minimo';
          const meta: HeatmapCellData | undefined = params.data?.meta;
          const valStr = meta?.formattedValue || formatMetricValue(params.data?.value, 'SMART_NUMBER');
          const cellTitle = meta ? `${meta.xValue} × ${meta.yValue}` : '';
          return `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 150px;">
              <div style="font-weight: 700; font-size: 13px; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px; color: ${isMax ? '#38bdf8' : '#93c5fd'};">
                ${badgeTitle}
              </div>
              ${cellTitle ? `<div style="font-size: 11px; color: #cbd5e1; margin-bottom: 4px;">${cellTitle}</div>` : ''}
              <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 4px;">
                <span style="color: #94a3b8;">Valore:</span>
                <span style="font-weight: 700; color: #38bdf8;">${valStr}</span>
              </div>
            </div>
          `;
        }

        const item = params.data?.value || params.data;
        if (!item) return '';
        const meta: HeatmapCellData = item[3];
        if (!meta) return '';

        // Tooltip dedicato: Gran Totale
        if (meta.isGrandTotal) {
          return `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 170px;">
                <div style="font-weight: 700; font-size: 13px; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px; color: #38bdf8;">
                  ★ Totale Generale
                </div>
                <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 4px;">
                  <span style="color: #94a3b8;">Valore Aggregato:</span>
                  <span style="font-weight: 700; color: #38bdf8;">${meta.formattedValue}</span>
                </div>
                <div style="font-size: 10px; color: #94a3b8; margin-top: 6px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 4px;">
                  Clicca per azzerare i filtri attivi
                </div>
              </div>
            `;
        }

        // Tooltip dedicato: Totale di Riga
        if (meta.isRowTotal) {
          return `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 170px;">
                <div style="font-weight: 700; font-size: 13px; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px; color: #38bdf8;">
                  Totale Riga: ${meta.yValue}
                </div>
                <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 4px;">
                  <span style="color: #94a3b8;">Totale:</span>
                  <span style="font-weight: 700; color: #38bdf8;">${meta.formattedValue}</span>
                </div>
                <div style="display: flex; justify-content: space-between; gap: 16px; font-size: 11px; color: #cbd5e1; margin-top: 4px; padding-top: 4px; border-top: 1px dashed rgba(255,255,255,0.15);">
                  <span>% su volume totale:</span>
                  <span><b>${formatPercentage(meta.totalPercentage)}</b></span>
                </div>
                <div style="font-size: 10px; color: #94a3b8; margin-top: 6px;">
                  Clicca per filtrare su ${yAxisDimension}: "${meta.yValue}"
                </div>
              </div>
            `;
        }

        // Tooltip dedicato: Totale di Colonna
        if (meta.isColTotal) {
          return `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 170px;">
                <div style="font-weight: 700; font-size: 13px; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px; color: #38bdf8;">
                  Totale Colonna: ${meta.xValue}
                </div>
                <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 4px;">
                  <span style="color: #94a3b8;">Totale:</span>
                  <span style="font-weight: 700; color: #38bdf8;">${meta.formattedValue}</span>
                </div>
                <div style="display: flex; justify-content: space-between; gap: 16px; font-size: 11px; color: #cbd5e1; margin-top: 4px; padding-top: 4px; border-top: 1px dashed rgba(255,255,255,0.15);">
                  <span>% su volume totale:</span>
                  <span><b>${formatPercentage(meta.totalPercentage)}</b></span>
                </div>
                <div style="font-size: 10px; color: #94a3b8; margin-top: 6px;">
                  Clicca per filtrare su ${xAxisDimension}: "${meta.xValue}"
                </div>
              </div>
            `;
        }

        // Tooltip per cella ordinaria
        const labelT1 = time1Label || 'Valore';
        const labelT2 = time2Label || 'Confronto';

        let valueBlock = `
          <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 4px;">
            <span style="color: #94a3b8;">${labelT1}:</span>
            <span style="font-weight: 700; color: #38bdf8;">${meta.formattedValue}</span>
          </div>
        `;

        if (meta.comparisonValue !== undefined && meta.comparisonValue !== null) {
          const compFormatted = formatMetricValue(meta.comparisonValue, 'SMART_NUMBER');
          let deltaFormatted = '';
          if (meta.isZeroBaseline) {
            deltaFormatted = '<span style="color: #38bdf8; font-weight: 700;">[Nuovo]</span>';
          } else if (meta.delta !== undefined && meta.delta !== null) {
            const deltaSign = meta.delta > 0 ? '+' : '';
            const pctSign = meta.deltaPercent !== null && meta.deltaPercent !== undefined && meta.deltaPercent > 0 ? '+' : '';
            const pctText = meta.deltaPercent !== null && meta.deltaPercent !== undefined ? ` (${pctSign}${meta.deltaPercent.toFixed(1)}%)` : '';
            const deltaColor = meta.delta >= 0 ? '#10b981' : '#f87171';
            deltaFormatted = `<span style="color: ${deltaColor}; font-weight: 700;">${deltaSign}${formatMetricValue(meta.delta, 'SMART_NUMBER')}${pctText}</span>`;
          }

          valueBlock = `
            <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 4px;">
              <span style="color: #94a3b8;">Valore:</span>
              <span style="font-weight: 700; color: #38bdf8;">${meta.formattedValue}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 4px;">
              <span style="color: #94a3b8;">${labelT2}:</span>
              <span style="font-weight: 600; color: #cbd5e1;">${compFormatted}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 4px;">
              <span style="color: #94a3b8;">Differenziale:</span>
              ${deltaFormatted}
            </div>
          `;
        }

        return `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <div style="font-weight: 700; font-size: 13px; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px;">
                ${meta.xValue} × ${meta.yValue}
              </div>
              ${valueBlock}
              ${
                showPercentages
                  ? `
                <div style="display: flex; justify-content: space-between; gap: 16px; font-size: 11px; color: #cbd5e1; margin-top: 4px; padding-top: 4px; border-top: 1px dashed rgba(255,255,255,0.15);">
                  <span>% su riga (${meta.yValue}):</span>
                  <span><b>${formatPercentage(meta.rowPercentage)}</b></span>
                </div>
                <div style="display: flex; justify-content: space-between; gap: 16px; font-size: 11px; color: #cbd5e1;">
                  <span>% su colonna (${meta.xValue}):</span>
                  <span><b>${formatPercentage(meta.colPercentage)}</b></span>
                </div>
                <div style="display: flex; justify-content: space-between; gap: 16px; font-size: 11px; color: #cbd5e1;">
                  <span>% su volume totale:</span>
                  <span><b>${formatPercentage(meta.totalPercentage)}</b></span>
                </div>
              `
                  : ''
              }
            </div>
          `;
      },
    },
    grid: {
      top: gridTop,
      right: gridRight,
      bottom: gridBottom,
      left: 70,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      position: xAxisPosition,
      data: xCategories,
      splitArea: {
        show: false,
      },
      axisLine: {
        lineStyle: {
          color: '#cbd5e1',
        },
      },
      axisLabel: {
        color: '#334155',
        fontSize: 11,
        fontWeight: 600,
        interval: 0,
        rotate: 0,
        margin: 12,
      },
    },
    yAxis: {
      type: 'category',
      data: yCategories,
      inverse: true,
      splitArea: {
        show: false,
      },
      axisLine: {
        lineStyle: {
          color: '#cbd5e1',
        },
      },
      axisLabel: {
        color: '#334155',
        fontSize: 11,
        fontWeight: 500,
      },
    },
    visualMap: visualMapConfig,
    series: [
      {
        name: 'StratumHeatmap',
        type: 'heatmap',
        data: seriesData,
        label: {
          show: showValues,
          formatter: (p: any) => {
            const rawVal = p.data?.value ? p.data.value[2] : p.data?.[2];
            const meta: HeatmapCellData | undefined = p.data?.value ? p.data.value[3] : p.data?.[3];
            if (rawVal === null || rawVal === undefined) return '';

            if (meta && meta.comparisonValue !== undefined && meta.comparisonValue !== null) {
              const valStr = formatMetricValue(rawVal, 'SMART_NUMBER');
              if (meta.isZeroBaseline) {
                return `${valStr}\n[Nuovo]`;
              }
              if (meta.delta !== undefined && meta.delta !== null) {
                const deltaSign = meta.delta > 0 ? '+' : '';
                const pctSign = meta.deltaPercent !== null && meta.deltaPercent !== undefined && meta.deltaPercent > 0 ? '+' : '';
                const pctStr = meta.deltaPercent !== null && meta.deltaPercent !== undefined ? ` (${pctSign}${meta.deltaPercent.toFixed(1)}%)` : '';
                return `${valStr}\n${deltaSign}${formatMetricValue(meta.delta, 'SMART_NUMBER')}${pctStr}`;
              }
            }

            if (rawVal === 0) return showZeroValues ? '0' : '';
            return formatMetricValue(rawVal, 'SMART_NUMBER');
          },
          fontSize: valueFontSize || 11,
          fontWeight: 600,
        },
        itemStyle: {
          borderRadius: cellRadius,
          borderColor: '#ffffff',
          borderWidth: 1,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.35)',
            borderColor: '#0284c7',
            borderWidth: 2,
          },
        },
        ...(showSmartAnnotations && smartAnnotationData.length > 0 && {
          markPoint: {
            symbol: 'pin',
            symbolSize: 30,
            label: {
              color: '#fff',
              fontSize: 10,
              fontWeight: 'bold',
              formatter: (p: any) => (p.name === 'Max' ? '🏆' : '📉'),
            },
            data: smartAnnotationData,
          },
        }),
      },
    ],
  };
}
