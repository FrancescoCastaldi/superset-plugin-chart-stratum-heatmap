import { describe, it, expect } from 'vitest';
import { getWeekdayRank, getHourRank, smartSortCategories } from '../src/utils/sorters';

describe('sorters utility', () => {
  describe('getWeekdayRank', () => {
    it('recognizes Italian weekdays with and without accents', () => {
      expect(getWeekdayRank('Lunedì')).toBe(1);
      expect(getWeekdayRank('lunedi')).toBe(1);
      expect(getWeekdayRank('Martedì')).toBe(2);
      expect(getWeekdayRank('martedi')).toBe(2);
      expect(getWeekdayRank('Mercoledì')).toBe(3);
      expect(getWeekdayRank('mercoledi')).toBe(3);
      expect(getWeekdayRank('Giovedì')).toBe(4);
      expect(getWeekdayRank('giovedi')).toBe(4);
      expect(getWeekdayRank('Venerdì')).toBe(5);
      expect(getWeekdayRank('venerdi')).toBe(5);
      expect(getWeekdayRank('Sabato')).toBe(6);
      expect(getWeekdayRank('sabato')).toBe(6);
      expect(getWeekdayRank('Domenica')).toBe(7);
      expect(getWeekdayRank('domenica')).toBe(7);
    });

    it('recognizes Italian weekdays with numeric prefix patterns', () => {
      expect(getWeekdayRank('1 - lunedi')).toBe(1);
      expect(getWeekdayRank('1 - Lunedì')).toBe(1);
      expect(getWeekdayRank('2 - Martedì')).toBe(2);
      expect(getWeekdayRank('3. Mercoledì')).toBe(3);
      expect(getWeekdayRank('7 – Domenica')).toBe(7);
    });

    it('recognizes English weekdays (full and abbreviated)', () => {
      expect(getWeekdayRank('Monday')).toBe(1);
      expect(getWeekdayRank('mon')).toBe(1);
      expect(getWeekdayRank('Tuesday')).toBe(2);
      expect(getWeekdayRank('tue')).toBe(2);
      expect(getWeekdayRank('Wednesday')).toBe(3);
      expect(getWeekdayRank('wed')).toBe(3);
      expect(getWeekdayRank('Thursday')).toBe(4);
      expect(getWeekdayRank('thu')).toBe(4);
      expect(getWeekdayRank('Friday')).toBe(5);
      expect(getWeekdayRank('Fri')).toBe(5);
      expect(getWeekdayRank('Saturday')).toBe(6);
      expect(getWeekdayRank('sat')).toBe(6);
      expect(getWeekdayRank('Sunday')).toBe(7);
      expect(getWeekdayRank('Sun')).toBe(7);
    });

    it('returns null for empty, non-day or invalid inputs', () => {
      expect(getWeekdayRank('')).toBeNull();
      expect(getWeekdayRank('Qualcosa')).toBeNull();
      expect(getWeekdayRank('Gennaio')).toBeNull();
      expect(getWeekdayRank('123')).toBeNull();
    });
  });

  describe('getHourRank', () => {
    it('recognizes standard HH:MM and HH:MM:SS formats', () => {
      expect(getHourRank('08:00')).toBe(8);
      expect(getHourRank('8:00')).toBe(8);
      expect(getHourRank('00:00')).toBe(0);
      expect(getHourRank('23:00')).toBe(23);
      expect(getHourRank('14:30:00')).toBe(14);
      expect(getHourRank('09:45:12')).toBe(9);
    });

    it('recognizes plain number string or number formats', () => {
      expect(getHourRank('8')).toBe(8);
      expect(getHourRank('0')).toBe(0);
      expect(getHourRank('23')).toBe(23);
      expect(getHourRank(12 as any)).toBe(12);
    });

    it('returns null for hours out of 0-23 range or invalid formats', () => {
      expect(getHourRank('24:00')).toBeNull();
      expect(getHourRank('25')).toBeNull();
      expect(getHourRank('-1')).toBeNull();
      expect(getHourRank('abc')).toBeNull();
      expect(getHourRank('')).toBeNull();
      expect(getHourRank(null as any)).toBeNull();
      expect(getHourRank(undefined as any)).toBeNull();
    });
  });

  describe('smartSortCategories', () => {
    it('sorts weekdays in ascending and descending order', () => {
      const unorderedDays = ['Venerdì', 'Lunedì', 'Domenica', 'Mercoledì', 'Martedì'];

      const sortedAsc = smartSortCategories(unorderedDays, true);
      expect(sortedAsc).toEqual(['Lunedì', 'Martedì', 'Mercoledì', 'Venerdì', 'Domenica']);

      const sortedDesc = smartSortCategories(unorderedDays, false);
      expect(sortedDesc).toEqual(['Domenica', 'Venerdì', 'Mercoledì', 'Martedì', 'Lunedì']);
    });

    it('sorts prefixed weekdays correctly', () => {
      const unordered = ['5 - Venerdì', '1 - Lunedì', '2 - Martedì'];
      expect(smartSortCategories(unordered, true)).toEqual([
        '1 - Lunedì',
        '2 - Martedì',
        '5 - Venerdì',
      ]);
    });

    it('sorts English weekdays correctly', () => {
      const unordered = ['Fri', 'Mon', 'Wed', 'Tue'];
      expect(smartSortCategories(unordered, true)).toEqual(['Mon', 'Tue', 'Wed', 'Fri']);
    });

    it('sorts hours in ascending and descending order', () => {
      const unorderedHours = ['14:00', '08:00', '23:00', '00:00', '9:00'];

      const sortedAsc = smartSortCategories(unorderedHours, true);
      expect(sortedAsc).toEqual(['00:00', '08:00', '9:00', '14:00', '23:00']);

      const sortedDesc = smartSortCategories(unorderedHours, false);
      expect(sortedDesc).toEqual(['23:00', '14:00', '9:00', '08:00', '00:00']);
    });

    it('falls back to natural alphanumeric sort for general strings', () => {
      const generalCategories = ['Reparto 10', 'Reparto 2', 'Reparto 1', 'Reparto 20'];

      const sortedAsc = smartSortCategories(generalCategories, true);
      expect(sortedAsc).toEqual(['Reparto 1', 'Reparto 2', 'Reparto 10', 'Reparto 20']);

      const sortedDesc = smartSortCategories(generalCategories, false);
      expect(sortedDesc).toEqual(['Reparto 20', 'Reparto 10', 'Reparto 2', 'Reparto 1']);
    });

    it('handles empty or single item arrays gracefully', () => {
      expect(smartSortCategories([])).toEqual([]);
      expect(smartSortCategories(['Single'])).toEqual(['Single']);
    });
  });
});
