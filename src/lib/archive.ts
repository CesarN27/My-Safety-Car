import { MONTHS_FULL } from '@/lib/format';
import type { Car } from '@/types';

export interface MonthFolder {
  /** "2026-10": sirve de llave y de nombre de carpeta (año/mes). */
  key: string;
  year: number;
  month: number;
  label: string;
  cars: Car[];
}

export interface YearFolder {
  year: number;
  count: number;
  months: MonthFolder[];
}

/** Agrupa los expedientes por año y mes de ingreso, lo más reciente primero. */
export function groupByYearMonth(cars: Car[]): YearFolder[] {
  const months = new Map<string, MonthFolder>();
  for (const c of cars) {
    const d = new Date(c.enteredAt);
    const year = d.getFullYear();
    const month = d.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    let m = months.get(key);
    if (!m) {
      m = { key, year, month, label: `${MONTHS_FULL[month][0].toUpperCase()}${MONTHS_FULL[month].slice(1)} ${year}`, cars: [] };
      months.set(key, m);
    }
    m.cars.push(c);
  }
  const years = new Map<number, YearFolder>();
  for (const m of [...months.values()].sort((a, b) => b.key.localeCompare(a.key))) {
    m.cars.sort((a, b) => b.enteredAt.localeCompare(a.enteredAt));
    const y = years.get(m.year) ?? { year: m.year, count: 0, months: [] };
    y.months.push(m);
    y.count += m.cars.length;
    years.set(m.year, y);
  }
  return [...years.values()].sort((a, b) => b.year - a.year);
}

/** Búsqueda por folio, placas, cliente, marca o modelo (sin acentos ni mayúsculas). */
export function matchesCar(c: Car, q: string) {
  const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const hay = norm([c.folio, c.plates, c.client.name, c.client.phone, c.brand, c.model].join(' '));
  return norm(q).split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}
