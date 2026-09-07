/**
 * Mappatura ordinale dei giorni della settimana (ISO-8601: Lunedì = 1, Domenica = 7)
 */
const WEEKDAY_ORDER: Record<string, number> = {
  // Italiano
  lunedi: 1,
  lunedì: 1,
  martedi: 2,
  martedì: 2,
  mercoledi: 3,
  mercoledì: 3,
  giovedi: 4,
  giovedì: 4,
  venerdi: 5,
  venerdì: 5,
  sabato: 6,
  domenica: 7,
  // Inglese
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
  sunday: 7,
  sun: 7,
};

/**
 * Estrae il valore ordinale di un giorno della settimana da una stringa.
 * Supporta formati come "1 - Lunedì", "Lunedì", "Monday", "Mon", ecc.
 */
export function getWeekdayRank(val: string): number | null {
  if (!val) return null;
  const clean = val.toLowerCase().trim();

  // Pattern con prefisso numerico es. "1 - lunedi" o "1. lunedì"
  const prefixMatch = clean.match(/^([1-7])\s*[-–.]\s*(.*)$/);
  if (prefixMatch) {
    return parseInt(prefixMatch[1], 10);
  }

  // Ricerca parola chiave
  for (const [dayName, rank] of Object.entries(WEEKDAY_ORDER)) {
    if (clean.includes(dayName)) {
      return rank;
    }
  }

  return null;
}

/**
 * Estrae il valore ordinale di un'ora (0 - 23).
 * Supporta formati come "08:00", "8:00", "08:00:00", o numeri "8".
 */
export function getHourRank(val: string): number | null {
  if (val === null || val === undefined) return null;
  const clean = String(val).trim();
  if (clean === '') return null;

  // Formato HH:MM o HH:MM:SS
  const timeMatch = clean.match(/^(\d{1,2}):\d{2}/);
  if (timeMatch) {
    const h = parseInt(timeMatch[1], 10);
    return h >= 0 && h <= 23 ? h : null;
  }

  // Numero intero puro (non stringa vuota)
  if (!/^\d+$/.test(clean)) {
    return null;
  }
  const num = Number(clean);
  if (!isNaN(num) && num >= 0 && num <= 23) {
    return num;
  }

  return null;
}

/**
 * Ordinatore intelligente universale per le categorie di asse (X o Y).
 * Rileva automaticamente se l'insieme di valori rappresenta Giorni della settimana o Ore,
 * applicando l'ordinamento cronologico corretto; altrimenti esegue ordinamento naturale.
 */
export function smartSortCategories(categories: string[], ascending = true): string[] {
  if (!categories || categories.length === 0) return [];

  const daysFound = categories.filter(c => getWeekdayRank(c) !== null).length;
  const isWeekdaySet = daysFound >= Math.ceil(categories.length * 0.7);

  if (isWeekdaySet) {
    return [...categories].sort((a, b) => {
      const rankA = getWeekdayRank(a) ?? 99;
      const rankB = getWeekdayRank(b) ?? 99;
      return ascending ? rankA - rankB : rankB - rankA;
    });
  }

  const hoursFound = categories.filter(c => getHourRank(c) !== null).length;
  const isHourSet = hoursFound >= Math.ceil(categories.length * 0.7);

  if (isHourSet) {
    return [...categories].sort((a, b) => {
      const rankA = getHourRank(a) ?? 99;
      const rankB = getHourRank(b) ?? 99;
      return ascending ? rankA - rankB : rankB - rankA;
    });
  }

  // Fallback: Ordinamento naturale alfanumerico
  return [...categories].sort((a, b) => {
    const res = a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    return ascending ? res : -res;
  });
}
