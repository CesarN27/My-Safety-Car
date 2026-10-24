import { expectNoLeaks, findLeaks } from './privacy.js';

describe('findLeaks', () => {
  it('detecta claves prohibidas anidadas, sin importar mayúsculas', () => {
    const leaks = findLeaks(
      { id: 1, car: { items: [{ Cost: 10 }] }, ok: true },
      { keys: ['cost'] },
    );
    expect(leaks).toEqual([
      { path: '$.car.items[0].Cost', reason: 'clave prohibida "Cost"' },
    ]);
  });

  it('detecta un valor sensible aunque venga con otro nombre de clave', () => {
    const leaks = findLeaks(
      { car: { amount: 1234.56 } },
      { values: [1234.56] },
    );
    expect(leaks).toHaveLength(1);
    expect(leaks[0]?.reason).toContain('1234.56');
  });

  it('detecta valores dentro de textos y arreglos', () => {
    expect(
      findLeaks(
        { notes: ['Proveedor: ProveedorSecreto'] },
        {
          values: ['ProveedorSecreto'],
        },
      ),
    ).toHaveLength(1);
  });

  it('no marca claves que solo contienen la palabra', () => {
    expectNoLeaks({ costumer: 'x', priceless: 1 }, { keys: ['cost', 'price'] });
  });

  it('acepta respuestas vacías o sin reglas', () => {
    expectNoLeaks(null, { keys: ['cost'], values: [1] });
    expectNoLeaks({ a: 1 }, {});
  });
});
