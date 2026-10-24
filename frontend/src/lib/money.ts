import type { Car, CarTotals, CostItem, Helper } from '@/types';

export const IVA_RATE = 0.16;

/** Pesos con centavos solo si los hay ($1,972 · $6,730.84), igual que los calcula el servidor. */
export const money = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Importe de una línea: unitario × cantidad, en centavos redondeados (como el servidor). */
const line = (unit: number, qty = 1) => Math.round(unit * qty * 100) / 100;

export function helperPay(items: CostItem[], helper?: Helper): number {
  if (!helper) return 0;
  if (helper.pay.type === 'fijo') return helper.pay.amount;
  const labor = sum(items.filter((i) => i.kind === 'mano').map((i) => line(i.price, i.qty)));
  return Math.round(labor * helper.pay.pct) / 100;
}

/**
 * Vista previa local mientras se editan costos (antes de guardar). Lo que se muestra después
 * de guardar es lo que calcula el servidor (`car.totals`).
 */
export function totals(items: CostItem[], ivaOn: boolean, helper?: Helper): CarTotals {
  const billable = items.filter((i) => i.kind !== 'gasto');
  const subtotal = sum(billable.map((i) => line(i.price, i.qty)));
  const iva = ivaOn ? Math.round(subtotal * IVA_RATE * 100) / 100 : 0;
  const parts = sum(items.filter((i) => i.kind === 'refaccion').map((i) => line(i.cost, i.qty)));
  const expenses = sum(items.filter((i) => i.kind === 'gasto').map((i) => line(i.cost, i.qty)));
  const helperCost = helperPay(items, helper);
  return {
    subtotal,
    iva,
    total: subtotal + iva,
    parts,
    expenses,
    helperCost,
    profit: subtotal - parts - helperCost - expenses,
  };
}

export function carTotals(car: Car, helpers: Helper[]): CarTotals {
  if (car.totals) return car.totals;
  return totals(
    car.costs,
    car.ivaOn,
    helpers.find((h) => h.id === car.helperId),
  );
}
