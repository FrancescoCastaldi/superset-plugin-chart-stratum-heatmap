import { useRef, useMemo, useEffect } from 'react';
import * as echarts from 'echarts/core';
import { CustomChart, HeatmapChart } from 'echarts/charts';
import {
  GraphicComponent,
  GridComponent,
  MarkPointComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { StratumHeatmapTransformedProps, HeatmapCellData } from '../types';
import { heatmapOptionFromProps } from './heatmapOption';
import { buildCellFilterClauses } from '../plugin/eventHandlers';

// MarkPointComponent backs the Max/Min pins, CustomChart the in-cell badges and GraphicComponent
// the legend text, all emitted by buildHeatmapOption.
echarts.use([
  HeatmapChart,
  CustomChart,
  GraphicComponent,
  GridComponent,
  MarkPointComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

export default function StratumHeatmap(props: StratumHeatmapTransformedProps) {
  const { width, height, activeCell, xAxisDimension, yAxisDimension, totalLabel = 'Total', onCellClick } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.EChartsType | null>(null);

  // Calcola le opzioni ECharts per il rendering (funzione pura in heatmapOptionFromProps)
  const option = useMemo(() => heatmapOptionFromProps(props), [props]);

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

      // Logica 1D/2D pura (gran totale, totali riga/colonna, toggle) in plugin/eventHandlers.ts
      onCellClick(
        buildCellFilterClauses(meta, activeCell, {
          xAxisDimension,
          yAxisDimension,
          totalLabel,
        }),
      );
    };

    chart.off('click');
    chart.on('click', handleClick);
  }, [option, onCellClick, xAxisDimension, yAxisDimension, activeCell, totalLabel]);

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
