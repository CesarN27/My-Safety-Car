import type { CarState } from '../../common/enums.js';
import { allowedNext, checkTransition } from './car-state.js';

const ok = (
  from: CarState,
  to: CarState,
  role: 'taller' | 'ayudante' = 'taller',
) => checkTransition({ from, to, role, hasTotal: true });

describe('checkTransition', () => {
  it('sigue el flujo del PDF', () => {
    expect(ok(0, 1)).toBeNull();
    expect(ok(1, 3)).toBeNull();
    expect(ok(1, 2)).toBeNull();
    expect(ok(2, 3)).toBeNull();
    expect(ok(3, 4)).toBeNull();
    expect(ok(4, 5)).toBeNull();
  });

  it('permite los regresos razonables: falta pieza en reparación, corrección antes de entregar', () => {
    expect(ok(3, 2)).toBeNull();
    expect(ok(4, 3)).toBeNull();
  });

  it('no permite saltos ni salir de Entregado', () => {
    expect(ok(0, 4)).toBe('transicion_invalida');
    expect(ok(0, 3)).toBe('transicion_invalida');
    expect(ok(2, 4)).toBe('transicion_invalida');
    expect(ok(1, 0)).toBe('transicion_invalida');
    for (const to of [0, 1, 2, 3, 4] as const)
      expect(ok(5, to)).toBe('transicion_invalida');
    expect(allowedNext(5)).toEqual([]);
  });

  it('rechaza quedarse en la misma etapa', () => {
    expect(ok(3, 3)).toBe('misma_etapa');
  });

  it('no deja marcar Listo sin total', () => {
    expect(
      checkTransition({ from: 3, to: 4, role: 'taller', hasTotal: false }),
    ).toBe('sin_total');
  });

  it('el ayudante mueve el trabajo pero no marca Listo ni Entregado', () => {
    expect(ok(0, 1, 'ayudante')).toBeNull();
    expect(ok(1, 2, 'ayudante')).toBeNull();
    expect(ok(2, 3, 'ayudante')).toBeNull();
    expect(ok(3, 4, 'ayudante')).toBe('rol_no_permitido');
    expect(ok(4, 5, 'ayudante')).toBe('rol_no_permitido');
  });

  it('cliente y admin nunca cambian el estado', () => {
    for (const role of ['cliente', 'admin'] as const)
      expect(checkTransition({ from: 0, to: 1, role, hasTotal: true })).toBe(
        'rol_no_permitido',
      );
  });
});
