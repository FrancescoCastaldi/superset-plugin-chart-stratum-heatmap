import { format as d3Format } from 'd3-format';

export function formatMetricValue(value: number | null | undefined, formatString = '~s'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  try {
    if (formatString === 'SMART_NUMBER') {
      if (Math.abs(value) >= 1_000_000) {
        return d3Format('.2s')(value).replace('G', 'B');
      }
      if (Math.abs(value) >= 1_000) {
        return d3Format('.2s')(value);
      }
      return Number.isInteger(value) ? d3Format(',d')(value) : d3Format(',.2f')(value);
    }
    return d3Format(formatString)(value);
  } catch {
    return String(value);
  }
}

export function formatPercentage(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0%';
  }
  return `${value.toFixed(decimals)}%`;
}
