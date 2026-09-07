import { describe, it, expect } from 'vitest';
import { getRelativeLuminance, getOptimalTextColor, interpolateColor } from '../src/utils/contrast';

describe('contrast utility', () => {
  describe('getRelativeLuminance', () => {
    it('calculates relative luminance for pure white (#ffffff -> 1)', () => {
      const lumWhite = getRelativeLuminance('#ffffff');
      expect(lumWhite).toBeCloseTo(1, 4);
    });

    it('calculates relative luminance for pure black (#000000 -> 0)', () => {
      const lumBlack = getRelativeLuminance('#000000');
      expect(lumBlack).toBeCloseTo(0, 4);
    });

    it('handles 3-digit hex colors shorthand', () => {
      expect(getRelativeLuminance('#fff')).toBeCloseTo(1, 4);
      expect(getRelativeLuminance('#000')).toBeCloseTo(0, 4);
    });

    it('calculates intermediate luminance values accurately', () => {
      // Dark corporate blue
      const lumDarkBlue = getRelativeLuminance('#1c3d5e');
      expect(lumDarkBlue).toBeGreaterThan(0.03);
      expect(lumDarkBlue).toBeLessThan(0.1);

      // Very light tint
      const lumLightBlue = getRelativeLuminance('#eef4f9');
      expect(lumLightBlue).toBeGreaterThan(0.85);
      expect(lumLightBlue).toBeLessThan(1.0);
    });

    it('returns default 0.5 fallback for invalid hex strings', () => {
      expect(getRelativeLuminance('invalid')).toBe(0.5);
      expect(getRelativeLuminance('')).toBe(0.5);
    });
  });

  describe('getOptimalTextColor', () => {
    it('returns light text (#ffffff) on dark backgrounds', () => {
      // Deep blue: #1c3d5e
      expect(getOptimalTextColor('#1c3d5e')).toBe('#ffffff');
      // Dark emerald: #1c4532
      expect(getOptimalTextColor('#1c4532')).toBe('#ffffff');
      // Deep orange/brown: #9c4221
      expect(getOptimalTextColor('#9c4221')).toBe('#ffffff');
      // Pure black
      expect(getOptimalTextColor('#000000')).toBe('#ffffff');
    });

    it('returns dark text (#1c3d5e) on light backgrounds', () => {
      // Light blue tint: #eef4f9
      expect(getOptimalTextColor('#eef4f9')).toBe('#1c3d5e');
      // Light emerald: #f0fff4
      expect(getOptimalTextColor('#f0fff4')).toBe('#1c3d5e');
      // Pure white
      expect(getOptimalTextColor('#ffffff')).toBe('#1c3d5e');
    });

    it('supports custom dark and light text parameters', () => {
      expect(getOptimalTextColor('#000000', '#222222', '#fafafa')).toBe('#fafafa');
      expect(getOptimalTextColor('#ffffff', '#222222', '#fafafa')).toBe('#222222');
    });

    it('returns darkText when bgHexColor is empty', () => {
      expect(getOptimalTextColor('')).toBe('#1c3d5e');
    });
  });

  describe('interpolateColor', () => {
    const palette = ['#000000', '#808080', '#ffffff'];

    it('returns first color at factor <= 0', () => {
      expect(interpolateColor(palette, 0)).toBe('#000000');
      expect(interpolateColor(palette, -0.5)).toBe('#000000');
    });

    it('returns last color at factor >= 1', () => {
      expect(interpolateColor(palette, 1)).toBe('#ffffff');
      expect(interpolateColor(palette, 1.5)).toBe('#ffffff');
    });

    it('interpolates correctly at midpoint and intermediate values', () => {
      const twoColors = ['#000000', '#ffffff'];
      const mid = interpolateColor(twoColors, 0.5);
      // Midpoint between 00 and ff is 128 (80 hex) -> #808080
      expect(mid.toLowerCase()).toBe('#808080');
    });

    it('handles empty or single color palettes safely', () => {
      expect(interpolateColor([], 0.5)).toBe('#3a6a9b');
      expect(interpolateColor(['#ff0000'], 0.5)).toBe('#ff0000');
    });
  });
});
