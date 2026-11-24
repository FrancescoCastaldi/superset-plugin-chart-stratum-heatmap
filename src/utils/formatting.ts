import { format as d3Format } from 'd3-format';
import { formatDuration, TimeFormatOptions } from './timeValues';
import { formatNumber, italianNumber } from './numberFormat';

/** `time` set: the values are seconds of a Time metric and are written as a duration */
export function formatMetricValue(
  value: number | null | undefined,
  formatString = '~s',
  time?: TimeFormatOptions,
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  if (time) return formatDuration(value, time);

  try {
    if (formatString === 'SMART_NUMBER') {
      if (Math.abs(value) >= 1_000_000) {
        return italianNumber(d3Format('.2s')(value).replace('G', 'B'));
      }
      if (Math.abs(value) >= 1_000) {
        return italianNumber(d3Format('.2s')(value));
      }
      return Number.isInteger(value) ? italianNumber(d3Format(',d')(value)) : italianNumber(d3Format(',.2f')(value));
    }
    return italianNumber(d3Format(formatString)(value));
  } catch {
    return String(value);
  }
}

export function formatPercentage(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0,0%';
  }
  return `${formatNumber(value, decimals, decimals)}%`;
}
