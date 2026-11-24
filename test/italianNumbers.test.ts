import { describe, it, expect } from 'vitest';
import { formatCompact, formatNumber, formatPercent, italianNumber } from '../src/utils/numberFormat';

describe('italian numbers', () => {
  it('swaps the separators of a number written in English', () => {
    expect(italianNumber('1,234.56')).toBe('1.234,56');
    expect(italianNumber('12.34%')).toBe('12,34%');
  });

  it('groups thousands with a dot and writes decimals with a comma', () => {
    expect(formatNumber(1234)).toBe('1.234');
    expect(formatNumber(1234567)).toBe('1.234.567');
    expect(formatNumber(7.03)).toBe('7,03');
    expect(formatNumber(-1234.5, 1, 1)).toBe('-1.234,5');
  });

  it('abbreviates and formats percentages in Italian', () => {
    expect(formatCompact(1200)).toBe('1,2k');
    expect(formatCompact(3_400_000)).toBe('3,4M');
    expect(formatPercent(0.1234)).toBe('12,3%');
  });
});
