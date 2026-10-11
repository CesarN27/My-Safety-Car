import type { Car, CostItem, Helper } from '@/types';

export const IVA_RATE = 0.16;

export const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function helperPay(items: CostItem[], helper?: Helper): number {
  if (!helper) return 0;
  if (helper.pay.type === 'fijo') return helper.pay.amount;
  const labor = sum(items.filter((i) => i.kind === 'mano').map((i) => i.price));
  return Math.round((labor * helper.pay.pct) / 100);
}

/** Todo lo que se calcula solo a partir de los conceptos del expediente. */
export function totals(items: CostItem[], ivaOn: boolean, helper?: Helper) {
  const billable = items.filter((i) => i.kind !== 'gasto');
  const subtotal = sum(billable.map((i) => i.price));
  const iva = ivaOn ? Math.round(subtotal * IVA_RATE) : 0;
  const parts = sum(items.filter((i) => i.kind === 'refaccion').map((i) => i.cost));
  const expenses = sum(items.filter((i) => i.kind === 'gasto').map((i) => i.cost));
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

export function carTotals(car: Car, helpers: Helper[]) {
  return totals(
    car.costs,
    car.ivaOn,
    helpers.find((h) => h.id === car.helperId),
  );
}
