import { describe, it, expect } from 'vitest';
import { formatMetricValue, formatPercentage } from '../src/utils/formatting';

describe('formatting utility', () => {
  describe('formatMetricValue', () => {
    it('returns "—" for null, undefined, or NaN values', () => {
      expect(formatMetricValue(null)).toBe('—');
      expect(formatMetricValue(undefined)).toBe('—');
      expect(formatMetricValue(NaN)).toBe('—');
    });

    it('formats numbers with default d3 format (~s)', () => {
      expect(formatMetricValue(1500)).toBe('1.5k');
      expect(formatMetricValue(2000000)).toBe('2M');
    });

    it('formats numbers using SMART_NUMBER for small integers', () => {
      expect(formatMetricValue(0, 'SMART_NUMBER')).toBe('0');
      expect(formatMetricValue(42, 'SMART_NUMBER')).toBe('42');
      expect(formatMetricValue(999, 'SMART_NUMBER')).toBe('999');
    });

    it('formats numbers using SMART_NUMBER for small decimals', () => {
      expect(formatMetricValue(12.3456, 'SMART_NUMBER')).toBe('12.35');
      expect(formatMetricValue(0.75, 'SMART_NUMBER')).toBe('0.75');
    });

    it('formats thousands with "k" under SMART_NUMBER', () => {
      expect(formatMetricValue(1200, 'SMART_NUMBER')).toBe('1.2k');
      expect(formatMetricValue(45000, 'SMART_NUMBER')).toBe('45k');
    });

    it('formats millions and billions with "M" and "B" under SMART_NUMBER', () => {
      expect(formatMetricValue(1200000, 'SMART_NUMBER')).toBe('1.2M');
      expect(formatMetricValue(3500000000, 'SMART_NUMBER')).toBe('3.5B');
    });

    it('falls back to string representation if invalid format string is provided', () => {
      expect(formatMetricValue(123, 'INVALID_FORMAT_%!@')).toBe('123');
    });
  });

  describe('formatPercentage', () => {
    it('returns "0.0%" for null, undefined, or NaN values', () => {
      expect(formatPercentage(null)).toBe('0.0%');
      expect(formatPercentage(undefined)).toBe('0.0%');
      expect(formatPercentage(NaN)).toBe('0.0%');
    });

    it('formats numbers as percentages with specified decimals', () => {
      expect(formatPercentage(15.678)).toBe('15.7%');
      expect(formatPercentage(15.678, 2)).toBe('15.68%');
      expect(formatPercentage(100, 0)).toBe('100%');
      expect(formatPercentage(0)).toBe('0.0%');
    });
  });
});
