/**
 * Calcola la luminanza relativa di un colore HEX secondo le linee guida W3C WCAG 2.1
 * (https://www.w3.org/TR/WCAG21/#dfn-relative-luminance)
 */
export function getRelativeLuminance(hexColor: string): number {
  let hex = hexColor.replace('#', '').trim();
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map(c => c + c)
      .join('');
  }
  if (hex.length !== 6) {
    return 0.5; // default fallback
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const sRGB = [r, g, b].map(val => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

/**
 * Restituisce il colore del testo ottimale (#ffffff o #1c3d5e) per massimizzare
 * il contrasto e l'accessibilità visiva su qualsiasi sfondo di cella della heatmap.
 */
export function getOptimalTextColor(bgHexColor: string, darkText = '#1c3d5e', lightText = '#ffffff'): string {
  if (!bgHexColor) return darkText;
  const lum = getRelativeLuminance(bgHexColor);
  // Se la luminanza dello sfondo è inferiore a 0.45, usa testo chiaro, altrimenti scuro
  return lum < 0.45 ? lightText : darkText;
}

/**
 * Interpola linearmente tra una palette di colori HEX dato un valore normalizzato [0, 1]
 */
export function interpolateColor(colors: string[], factor: number): string {
  if (!colors || colors.length === 0) return '#3a6a9b';
  if (colors.length === 1) return colors[0];
  if (factor <= 0) return colors[0];
  if (factor >= 1) return colors[colors.length - 1];

  const totalSegments = colors.length - 1;
  const scaledFactor = factor * totalSegments;
  const index = Math.floor(scaledFactor);
  const localFactor = scaledFactor - index;

  const c1 = colors[index].replace('#', '');
  const c2 = colors[Math.min(index + 1, colors.length - 1)].replace('#', '');

  const r1 = parseInt(c1.substring(0, 2), 16);
  const g1 = parseInt(c1.substring(2, 4), 16);
  const b1 = parseInt(c1.substring(4, 6), 16);

  const r2 = parseInt(c2.substring(0, 2), 16);
  const g2 = parseInt(c2.substring(2, 4), 16);
  const b2 = parseInt(c2.substring(4, 6), 16);

  const r = Math.round(r1 + (r2 - r1) * localFactor);
  const g = Math.round(g1 + (g2 - g1) * localFactor);
  const b = Math.round(b1 + (b2 - b1) * localFactor);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
