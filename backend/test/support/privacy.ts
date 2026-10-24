/**
 * Detector de filtraciones para las pruebas de privacidad por rol: recorre una respuesta JSON y
 * reporta claves prohibidas (por nombre, sin importar mayúsculas) y valores sensibles (por texto).
 * Revisar valores, además de claves, atrapa filtraciones con otro nombre (`amount`, `gain`…).
 */
export interface Leak {
  path: string;
  reason: string;
}

export interface LeakRules {
  /** Nombres de clave prohibidos, en minúsculas. */
  keys?: readonly string[];
  /** Valores que no pueden aparecer en ninguna parte de la respuesta. */
  values?: readonly (string | number)[];
}

/** Nunca los ven ni el ayudante ni el cliente. */
export const COMMON_FORBIDDEN_KEYS = [
  'cost',
  'costs',
  'costitems',
  'price',
  'prices',
  'profit',
  'ganancia',
  'gasto',
  'gastos',
  'expense',
  'expenses',
  'supplier',
  'proveedor',
  'subtotal',
  'iva',
  'ivaon',
] as const;

/** El ayudante no ve ningún total; sí ve su propio pago. */
export const HELPER_FORBIDDEN_KEYS = [
  ...COMMON_FORBIDDEN_KEYS,
  'total',
] as const;

/** El cliente ve el total, pero no lo que se le paga a nadie. */
export const CLIENT_FORBIDDEN_KEYS = [
  ...COMMON_FORBIDDEN_KEYS,
  'pay',
  'payamount',
  'paypct',
  'paid',
  'helperpayment',
  'helperpayments',
] as const;

export function findLeaks(body: unknown, rules: LeakRules): Leak[] {
  const leaks: Leak[] = [];
  const keys = new Set(rules.keys ?? []);

  const walk = (node: unknown, path: string) => {
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}[${i}]`));
    } else if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        if (keys.has(key.toLowerCase()))
          leaks.push({
            path: `${path}.${key}`,
            reason: `clave prohibida "${key}"`,
          });
        walk(value, `${path}.${key}`);
      }
    }
  };
  walk(body, '$');

  const text = JSON.stringify(body) ?? '';
  for (const value of rules.values ?? []) {
    if (text.includes(String(value)))
      leaks.push({ path: '$', reason: `valor sensible "${String(value)}"` });
  }
  return leaks;
}

/** Falla con la lista completa de filtraciones, para que se vea qué se escapó y dónde. */
export function expectNoLeaks(body: unknown, rules: LeakRules) {
  const leaks = findLeaks(body, rules);
  expect(leaks, JSON.stringify(leaks, null, 2)).toEqual([]);
}
