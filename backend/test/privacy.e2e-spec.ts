import { Car } from '../src/modules/cars/car.entity.js';
import { createTestApp, ADMIN_PHONE } from './support/app.js';
import {
  MONEY_VALUES,
  PHONES,
  S,
  seedPrivacyFixture,
  type PrivacyFixture,
} from './support/fixture.js';
import {
  CLIENT_FORBIDDEN_KEYS,
  HELPER_FORBIDDEN_KEYS,
  expectNoLeaks,
  findLeaks,
} from './support/privacy.js';

/**
 * Pruebas de privacidad por rol (docs/arquitectura-backend.md, sección 4 y 6).
 *
 * - Los controles de abajo corren siempre: aseguran que el fixture contiene de verdad los valores
 *   sensibles, para que ninguna prueba de privacidad pase por estar vacía.
 * - El bloque "superficies de API" está escrito antes que los endpoints y se activa quitando
 *   `.skip` cuando existan `/shop`, `/helper`, `/client` y `/public/q`.
 */
describe('Privacidad por rol (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let f: PrivacyFixture;

  beforeAll(async () => {
    t = await createTestApp();
    f = await seedPrivacyFixture(t.ds);
  });
  afterAll(() => t.app.close());

  describe('controles del fixture', () => {
    it('el detector sí encuentra los datos sensibles en lo que ve el dueño del taller', async () => {
      const car = await t.ds.getRepository(Car).findOneOrFail({
        where: { id: f.carListo.id },
        relations: { costs: true, helper: true },
      });
      const leaks = findLeaks(car, {
        keys: HELPER_FORBIDDEN_KEYS,
        values: [S.partCost, S.partPrice, S.laborPrice, S.supplier],
      });
      expect(leaks.length).toBeGreaterThan(0);
      // y también el pago del ayudante, que el cliente jamás debe ver
      expect(
        findLeaks(car, { keys: CLIENT_FORBIDDEN_KEYS, values: [S.helperPay] }),
      ).not.toEqual([]);
    });

    it('el total del fixture es lo único del dinero que no está en la lista de prohibidos', () => {
      expect(MONEY_VALUES).not.toContain(S.total);
      expect(S.subtotal + S.partCost).toBeGreaterThan(0);
      // 5802.45 × 1.16 = 6730.842
      expect(Math.round(S.subtotal * 1.16 * 100) / 100).toBe(S.total);
      // 5802.45 − 1234.56 − 987.65 − 111.11
      expect(
        Math.round(
          (S.subtotal - S.partCost - S.helperPay - S.expenseCost) * 100,
        ) / 100,
      ).toBe(S.profit);
    });
  });

  describe.skip('superficies de API (se activa con los endpoints)', () => {
    const tokens: Record<string, string> = {};
    const get = (path: string, who: string) =>
      t.http().get(path).set(t.bearer(tokens[who]!));
    const ids = (body: { id: string }[]) => body.map((c) => c.id).sort();

    beforeAll(async () => {
      for (const [who, phone] of Object.entries({
        ownerA: PHONES.ownerA,
        ownerB: PHONES.ownerB,
        helper1: PHONES.helper1,
        helper2: PHONES.helper2,
        client: PHONES.client,
        admin: ADMIN_PHONE,
      }))
        tokens[who] = (await t.login(phone)).accessToken;
    });

    it('sin sesión, todas las superficies responden 401', async () => {
      for (const path of ['/shop/cars', '/helper/cars', '/client/cars'])
        await t.http().get(path).expect(401);
    });

    it('cada superficie es solo de su rol', async () => {
      await get('/shop/cars', 'client').expect(403);
      await get('/shop/cars', 'helper1').expect(403);
      await get('/shop/cars', 'admin').expect(403);
      await get('/helper/cars', 'ownerA').expect(403);
      await get('/helper/cars', 'client').expect(403);
      await get('/client/cars', 'ownerA').expect(403);
      await get('/client/cars', 'helper1').expect(403);
      await get('/client/cars', 'admin').expect(403);
    });

    it('el dueño ve el desglose completo de su taller (control positivo)', async () => {
      const res = await get(`/shop/cars/${f.carListo.id}`, 'ownerA').expect(
        200,
      );
      const text = JSON.stringify(res.body);
      for (const v of [S.partCost, S.partPrice, S.laborPrice, S.supplier])
        expect(text).toContain(String(v));
    });

    it('un taller no ve coches de otro: lista y detalle', async () => {
      const list = await get('/shop/cars', 'ownerA').expect(200);
      expect(ids(list.body)).toEqual(ids([f.carListo, f.carDiag, f.carAjeno]));
      await get(`/shop/cars/${f.carB.id}`, 'ownerA').expect(404);
      await get(`/shop/cars/${f.carListo.id}`, 'ownerB').expect(404);
    });

    it('el ayudante solo ve sus coches y jamás costos, ganancia ni totales', async () => {
      const list = await get('/helper/cars', 'helper1').expect(200);
      expect(ids(list.body)).toEqual(ids([f.carListo, f.carDiag]));
      expectNoLeaks(list.body, {
        keys: HELPER_FORBIDDEN_KEYS,
        values: [...MONEY_VALUES, S.total, S.diagPrice, S.diagCost],
      });

      for (const car of [f.carListo, f.carDiag]) {
        const one = await get(`/helper/cars/${car.id}`, 'helper1').expect(200);
        expectNoLeaks(one.body, {
          keys: HELPER_FORBIDDEN_KEYS,
          values: [...MONEY_VALUES, S.total, S.diagPrice, S.diagCost],
        });
      }
      // coche de otro ayudante y de otro taller
      await get(`/helper/cars/${f.carAjeno.id}`, 'helper1').expect(404);
      await get(`/helper/cars/${f.carB.id}`, 'helper1').expect(404);
    });

    it('el ayudante ve su propio pago pero no el de otro', async () => {
      const res = await get('/helper/payments', 'helper1').expect(200);
      expect(JSON.stringify(res.body)).toContain(String(S.helperPay));
      expectNoLeaks(res.body, {
        keys: HELPER_FORBIDDEN_KEYS,
        values: [S.profit, S.subtotal],
      });
    });

    it('el cliente ve solo sus coches y el total únicamente cuando está listo', async () => {
      const list = await get('/client/cars', 'client').expect(200);
      // el mismo teléfono es cliente en dos talleres; solo ve sus coches
      expect(ids(list.body)).toEqual(ids([f.carListo, f.carDiag, f.carB]));

      const listo = await get(`/client/cars/${f.carListo.id}`, 'client').expect(
        200,
      );
      expect(JSON.stringify(listo.body)).toContain(String(S.total));
      expectNoLeaks(listo.body, {
        keys: CLIENT_FORBIDDEN_KEYS,
        values: [
          ...MONEY_VALUES,
          S.helperPay,
          S.otherClientAddress,
          S.otherClientPhone,
        ],
      });

      const diag = await get(`/client/cars/${f.carDiag.id}`, 'client').expect(
        200,
      );
      expectNoLeaks(diag.body, {
        keys: CLIENT_FORBIDDEN_KEYS,
        values: [...MONEY_VALUES, S.diagPrice, S.diagCost],
      });

      await get(`/client/cars/${f.carAjeno.id}`, 'client').expect(404);
    });

    it('la vista pública del QR muestra el estado y nada de dinero ni datos personales', async () => {
      const res = await t
        .http()
        .get(`/public/q/${f.carListo.qrToken}`)
        .expect(200);
      expectNoLeaks(res.body, {
        keys: CLIENT_FORBIDDEN_KEYS,
        values: [
          ...MONEY_VALUES,
          S.total,
          S.helperPay,
          S.clientAddress,
          PHONES.client,
          S.otherClientPhone,
        ],
      });
      await t.http().get('/public/q/token-inexistente').expect(404);
    });
  });
});
