import { computeTotals, helperPayCents, type PricedItem } from './pricing.js';

const items: PricedItem[] = [
  { kind: 'refaccion', cost: 1234.56, price: 2345.67 },
  { kind: 'mano', cost: 0, price: 3456.78 },
  { kind: 'gasto', cost: 111.11, price: 0 },
];
const fijo = { payType: 'fijo' as const, payAmount: 987.65, payPct: null };

describe('computeTotals', () => {
  it('calcula subtotal, IVA, total y ganancia como el PDF', () => {
    expect(computeTotals(items, { ivaOn: true, helper: fijo })).toEqual({
      subtotal: 5802.45,
      iva: 928.39, // 5802.45 × 0.16 = 928.392
      total: 6730.84,
      parts: 1234.56,
      expenses: 111.11,
      helperPay: 987.65,
      profit: 3469.13, // 5802.45 − 1234.56 − 987.65 − 111.11
    });
  });

  it('sin IVA el total es el subtotal', () => {
    const t = computeTotals(items, { ivaOn: false });
    expect(t.iva).toBe(0);
    expect(t.total).toBe(5802.45);
  });

  it('acepta otra tasa de IVA (zona fronteriza, 8 %)', () => {
    expect(computeTotals(items, { ivaOn: true, ivaPct: 8 }).iva).toBe(464.2);
  });

  it('no arrastra errores de punto flotante', () => {
    // 0.1 + 0.2 en flotantes es 0.30000000000000004
    const t = computeTotals(
      [
        { kind: 'mano', cost: 0, price: 0.1 },
        { kind: 'mano', cost: 0, price: 0.2 },
      ],
      { ivaOn: false },
    );
    expect(t.subtotal).toBe(0.3);
  });

  it('los gastos nunca se le cobran al cliente, aunque traigan precio', () => {
    const t = computeTotals([{ kind: 'gasto', cost: 50, price: 80 }], {
      ivaOn: true,
    });
    expect(t.total).toBe(0);
    expect(t.profit).toBe(-50);
  });

  it('sin conceptos todo es cero', () => {
    expect(computeTotals([], { ivaOn: true })).toEqual({
      subtotal: 0,
      iva: 0,
      total: 0,
      parts: 0,
      expenses: 0,
      helperPay: 0,
      profit: 0,
    });
  });
});

describe('helperPayCents', () => {
  it('fijo: el monto por coche, haya o no mano de obra', () => {
    expect(helperPayCents([], fijo)).toBe(98765);
  });

  it('porcentaje: solo sobre la mano de obra, redondeado al centavo', () => {
    const rate = {
      payType: 'porcentaje' as const,
      payAmount: null,
      payPct: 30,
    };
    // 30 % de 3456.78 = 1037.034
    expect(helperPayCents(items, rate)).toBe(103703);
  });

  it('sin ayudante asignado no hay pago', () => {
    expect(helperPayCents(items, null)).toBe(0);
  });
});
