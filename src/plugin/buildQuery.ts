import { buildQueryContext, QueryContext, ensureIsArray } from '@superset-ui/core';
import { StratumHeatmapFormData } from '../types';

export default function buildQuery(formData: StratumHeatmapFormData): QueryContext {
  const fd: any = formData || {};
  const {
    xAxisDimension,
    yAxisDimension,
    x_axis,
    groupby,
    columns: pivotCols,
    metric,
    metrics = [],
  } = fd;

  return buildQueryContext(formData as any, (baseQueryObject: any) => {
    // Risoluzione flessibile delle due dimensioni matrice
    const dimX = xAxisDimension || x_axis || ensureIsArray(groupby)[0];
    const dimY = yAxisDimension || ensureIsArray(pivotCols)[0] || ensureIsArray(groupby)[1];

    const selectedColumns = [dimX, dimY].filter(Boolean);
    const resolvedMetrics = metric ? [metric] : ensureIsArray(metrics);

    return [
      {
        ...baseQueryObject,
        columns: selectedColumns,
        metrics: resolvedMetrics,
      },
    ];
  });
}
