import React, { useRef, useMemo, useEffect } from 'react';
import * as echarts from 'echarts';
import { StratumHeatmapTransformedProps, HeatmapCellData, HeatmapDatum } from '../types';
import { formatPercentage, formatMetricValue } from '../utils/formatting';

export default function StratumHeatmap(props: StratumHeatmapTransformedProps) {
  const {
    width,
    height,
    xCategories,
    yCategories,
    matrixData,
    minValue,
    maxValue,
    visualMapMode,
    piecewiseBuckets = 5,
    xAxisLabelRotation = 0,
    colorRange,
    showValues,
    showPercentages,
    cellRadius,
    cellBorderWidth,
    cellBorderColor,
    xAxisDimension,
    yAxisDimension,
    activeCell,
    onCellClick,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.EChartsType | null>(null);

  // Calcola le opzioni ECharts per il rendering
  const option = useMemo(() => {
    // Configurazione visualMap (Continua vs Piecewise)
    const visualMapConfig: any = {
      min: minValue,
      max: maxValue,
      calculable: visualMapMode === 'continuous',
      orient: 'horizontal',
      left: 'center',
      bottom: 8,
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

    // Normalizzazione dati serie ECharts con evidenziazione cella attiva
    const seriesData = matrixData.map(item => {
      let coords: [number, number, number | null, HeatmapCellData];
      let labelColor: string | undefined;

      if (Array.isArray(item)) {
        coords = item;
      } else {
        coords = item.value;
        labelColor = item.label?.color;
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
      };

      if (labelColor) {
        datum.label = {
          color: labelColor,
        };
      }

      if (isSelected) {
        datum.itemStyle = {
          borderColor: '#0284c7',
          borderWidth: Math.max(cellBorderWidth + 2, 3),
          shadowBlur: 8,
          shadowColor: 'rgba(2, 132, 199, 0.6)',
        };
      }

      return datum;
    });

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
          const item = params.data?.value || params.data;
          if (!item) return '';
          const meta: HeatmapCellData = item[3];
          if (!meta) return '';

          return `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <div style="font-weight: 700; font-size: 13px; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px;">
                ${meta.xValue} × ${meta.yValue}
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 4px;">
                <span style="color: #94a3b8;">Valore:</span>
                <span style="font-weight: 700; color: #38bdf8;">${meta.formattedValue}</span>
              </div>
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
        top: 24,
        right: 28,
        bottom: 65,
        left: 60,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
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
          rotate: xAxisLabelRotation,
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
              const val = p.data?.value ? p.data.value[2] : p.data?.[2];
              if (val === 0 || val === null || val === undefined) return '';
              return formatMetricValue(val, 'SMART_NUMBER');
            },
            fontSize: 11,
            fontWeight: 600,
          },
          itemStyle: {
            borderRadius: cellRadius,
            borderColor: cellBorderColor,
            borderWidth: cellBorderWidth,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.35)',
              borderColor: '#0284c7',
              borderWidth: Math.max(cellBorderWidth + 1, 2),
            },
          },
        },
      ],
    };
  }, [
    xCategories,
    yCategories,
    matrixData,
    minValue,
    maxValue,
    visualMapMode,
    piecewiseBuckets,
    xAxisLabelRotation,
    colorRange,
    showValues,
    showPercentages,
    cellRadius,
    cellBorderWidth,
    cellBorderColor,
    activeCell,
  ]);

  // Inizializzazione istanza ECharts e gestione resize
  useEffect(() => {
    if (!containerRef.current) return;
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(containerRef.current, undefined, {
        renderer: 'canvas',
      });
    }
    chartInstanceRef.current.resize({ width, height });
  }, [width, height]);

  // Aggiornamento opzioni ed eventi click per cross-filtering
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    chart.setOption(option, true);

    const handleClick = (params: any) => {
      if (!onCellClick || !params.data) return;
      const coords = params.data.value || params.data;
      const meta: HeatmapCellData = coords?.[3];
      if (!meta) return;

      // Se la cella cliccata è già attiva, resetta il filtro (toggle)
      if (
        activeCell &&
        String(activeCell.x) === String(meta.xValue) &&
        String(activeCell.y) === String(meta.yValue)
      ) {
        onCellClick([]);
        return;
      }

      // Altrimenti emette cross-filter congiunto su X e Y
      onCellClick([
        {
          col: xAxisDimension,
          op: 'IN',
          val: [meta.xValue],
        },
        {
          col: yAxisDimension,
          op: 'IN',
          val: [meta.yValue],
        },
      ]);
    };

    chart.off('click');
    chart.on('click', handleClick);
  }, [option, onCellClick, xAxisDimension, yAxisDimension, activeCell]);

  // Cleanup alla distruzione del componente
  useEffect(() => {
    return () => {
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        background: '#ffffff',
        overflow: 'hidden',
      }}
    />
  );
}
