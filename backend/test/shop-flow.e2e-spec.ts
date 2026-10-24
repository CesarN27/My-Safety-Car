import { createTestApp, ADMIN_PHONE } from './support/app.js';
import {
  PHONES,
  seedPrivacyFixture,
  type PrivacyFixture,
} from './support/fixture.js';

/** Flujo completo de un expediente por la API, de la recepción a la entrega. */
describe('Flujo del taller (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let f: PrivacyFixture;
  const tok: Record<string, string> = {};
  const as = (who: string) => ({
    get: (p: string) => t.http().get(p).set(t.bearer(tok[who]!)),
    post: (p: string, body: object = {}) =>
      t.http().post(p).set(t.bearer(tok[who]!)).send(body),
    patch: (p: string, body: object) =>
      t.http().patch(p).set(t.bearer(tok[who]!)).send(body),
    put: (p: string, body: object) =>
      t.http().put(p).set(t.bearer(tok[who]!)).send(body),
  });
  const owner = () => as('ownerA');

  const NEW_CAR = {
    client: { name: 'Carla', phone: '55 2000 0001', address: 'Calle 5' },
    vehicle: {
      brand: 'Nissan',
      model: 'Versa',
      year: '2019',
      color: 'Blanco',
      plates: 'abc-123',
    },
    km: '85000',
    fuel: 0.5,
    inspection: { Llantas: 0, Espejos: 1, Frenos: 2 },
    damages: [
      {
        id: 1,
        x: 0.2,
        y: 0.4,
        note: 'Golpe en puerta',
        view: 'izquierda',
        type: 'golpe',
      },
    ],
    description: 'Ruido al frenar',
    clientDescription: 'Revisión de frenos',
  };

  beforeAll(async () => {
    t = await createTestApp();
    f = await seedPrivacyFixture(t.ds);
    for (const [who, phone] of Object.entries({
      ownerA: PHONES.ownerA,
      ownerB: PHONES.ownerB,
      helper1: PHONES.helper1,
      admin: ADMIN_PHONE,
    }))
      tok[who] = (await t.login(phone)).accessToken;
  });
  afterAll(() => t.app.close());

  let carId: string;
  let qrToken: string;
  let vehicleId: string;

  describe('alta del expediente', () => {
    it('crea cliente, vehículo y expediente con folio consecutivo y bitácora inicial', async () => {
      const res = await owner().post('/shop/cars', NEW_CAR).expect(201);
      carId = res.body.id;
      qrToken = res.body.qrToken;
      vehicleId = res.body.vehicle.id;
      expect(res.body).toMatchObject({
        folio: '0001',
        state: 0,
        ivaOn: true,
        vehicle: { plates: 'ABC-123', brand: 'Nissan' },
        client: { name: 'Carla', phone: '525520000001', hasAccount: false },
        inspection: { Espejos: 1 },
        allowedNext: [1],
      });
      expect(res.body.log).toHaveLength(1);
      expect(qrToken.length).toBeGreaterThanOrEqual(30);
    });

    it('una visita de regreso reusa el vehículo y suma al historial', async () => {
      const res = await owner()
        .post('/shop/cars', { client: NEW_CAR.client, vehicleId, km: '91000' })
        .expect(201);
      expect(res.body.folio).toBe('0002');
      const v = await owner().get(`/shop/vehicles/${vehicleId}`).expect(200);
      expect(v.body.visits).toHaveLength(2);
      const found = await owner().get('/shop/vehicles?q=abc').expect(200);
      expect(found.body.map((x: { id: string }) => x.id)).toContain(vehicleId);
    });

    it('si el cliente ya tiene cuenta, queda ligado al capturarlo', async () => {
      const res = await owner()
        .post('/shop/cars', {
          ...NEW_CAR,
          client: { name: 'Ana', phone: PHONES.client },
          vehicle: { ...NEW_CAR.vehicle, plates: 'XYZ-999' },
        })
        .expect(201);
      expect(res.body.client.hasAccount).toBe(true);
    });

    it('altas simultáneas reciben folios distintos', async () => {
      const results = await Promise.all(
        Array.from({ length: 8 }, (_, i) =>
          owner().post('/shop/cars', {
            ...NEW_CAR,
            // el mismo cliente nuevo en todas: no debe chocar la restricción única
            client: { name: 'Simultáneo', phone: '5560000001' },
            vehicle: { ...NEW_CAR.vehicle, plates: `SIM-${i}` },
          }),
        ),
      );
      expect(results.map((r) => r.status)).toEqual(Array(8).fill(201));
      const folios = new Set(results.map((r) => r.body.folio as string));
      expect(folios.size).toBe(8);
      expect(new Set(results.map((r) => r.body.client.id as string)).size).toBe(
        1,
      );
    });

    it('valida la entrada', async () => {
      const bad = [
        { ...NEW_CAR, inspection: { Alerón: 0 } },
        { ...NEW_CAR, inspection: { Llantas: 7 } },
        { ...NEW_CAR, vehicleId },
        { ...NEW_CAR, fuel: 2 },
        { ...NEW_CAR, helperId: 'no-es-uuid' },
        { ...NEW_CAR, shopId: f.shopB.id },
      ];
      for (const body of bad)
        await owner().post('/shop/cars', body).expect(400);
    });

    it('no acepta ayudantes ni vehículos de otro taller', async () => {
      await as('ownerB')
        .post('/shop/cars', { ...NEW_CAR, helperId: f.helper1.id })
        .expect(400);
      await as('ownerB')
        .post('/shop/cars', { client: NEW_CAR.client, vehicleId, km: '1' })
        .expect(400);
    });
  });

  describe('costos y etapas', () => {
    it('no deja saltar etapas ni marcar Listo sin total', async () => {
      await owner().post(`/shop/cars/${carId}/state`, { state: 4 }).expect(409);
      await owner().post(`/shop/cars/${carId}/state`, { state: 1 }).expect(201);
      await owner()
        .post(`/shop/cars/${carId}/state`, { state: 3, note: 'Empezamos' })
        .expect(201);
      const res = await owner()
        .post(`/shop/cars/${carId}/state`, { state: 4 })
        .expect(409);
      expect(res.body.message).toContain('costos');
    });

    it('calcula el dinero en el servidor, con cantidad e IVA del taller', async () => {
      await owner()
        .patch(`/shop/cars/${carId}`, { helperId: f.helper1.id })
        .expect(200);
      const res = await owner()
        .put(`/shop/cars/${carId}/costs`, {
          items: [
            {
              kind: 'refaccion',
              desc: 'Balatas',
              qty: 2,
              cost: 300,
              price: 450,
              supplier: 'Refaccionaria',
            },
            { kind: 'mano', desc: 'Cambio de balatas', cost: 0, price: 800 },
            { kind: 'gasto', desc: 'Grasa', cost: 50, price: 0 },
          ],
        })
        .expect(200);
      // subtotal 900 + 800 = 1700; IVA 272; ayudante fijo 987.65; ganancia 1700 − 600 − 987.65 − 50
      expect(res.body.totals).toEqual({
        subtotal: 1700,
        iva: 272,
        total: 1972,
        parts: 600,
        expenses: 50,
        helperPay: 987.65,
        profit: 62.35,
      });
      expect(res.body.costs.map((c: { qty: number }) => c.qty)).toEqual([
        2, 1, 1,
      ]);

      await owner().patch('/shop/settings', { ivaPct: 8 }).expect(200);
      const again = await owner().get(`/shop/cars/${carId}`).expect(200);
      expect(again.body.totals.iva).toBe(136);
      await owner().patch('/shop/settings', { ivaPct: 16 }).expect(200);
    });

    it('en Listo no se cambian costos; al entregar se congela el pago del ayudante', async () => {
      await owner().post(`/shop/cars/${carId}/state`, { state: 4 }).expect(201);
      await owner().put(`/shop/cars/${carId}/costs`, { items: [] }).expect(409);
      const res = await owner()
        .post(`/shop/cars/${carId}/state`, { state: 5, note: 'Entregado' })
        .expect(201);
      expect(res.body.deliveredAt).not.toBeNull();
      expect(res.body.log.at(-1)).toMatchObject({
        fromState: 4,
        state: 5,
        note: 'Entregado',
      });

      // cambiar la tarifa después no mueve lo ya entregado
      await owner()
        .patch(`/shop/helpers/${f.helper1.id}`, {
          payType: 'fijo',
          payAmount: 10,
        })
        .expect(200);
      const after = await owner().get(`/shop/cars/${carId}`).expect(200);
      expect(after.body.totals.helperPay).toBe(987.65);
    });

    it('un expediente entregado ya no se modifica y su QR deja de servir', async () => {
      await owner().patch(`/shop/cars/${carId}`, { km: '1' }).expect(409);
      await owner()
        .post(`/shop/cars/${carId}/notes`, { note: 'x' })
        .expect(409);
      await owner().post(`/shop/cars/${carId}/state`, { state: 3 }).expect(409);
      await t.http().get(`/public/q/${qrToken}`).expect(404);
    });

    it('el reporte suma los coches entregados en el rango', async () => {
      const today = new Date();
      const day = (d: Date) => d.toISOString().slice(0, 10);
      const tomorrow = new Date(today.getTime() + 86_400_000 * 2);
      const yesterday = new Date(today.getTime() - 86_400_000 * 2);
      const res = await owner()
        .get(`/shop/reports?from=${day(yesterday)}&to=${day(tomorrow)}`)
        .expect(200);
      expect(res.body).toMatchObject({ cars: 1, total: 1972, profit: 62.35 });
    });
  });

  describe('pagos a ayudantes', () => {
    it('el pago congelado queda pendiente y se marca pagado una sola vez', async () => {
      const pending = await owner()
        .get('/shop/payments?pending=true')
        .expect(200);
      expect(pending.body).toHaveLength(1);
      expect(pending.body[0]).toMatchObject({ amount: 987.65, paidAt: null });

      const mine = await as('helper1').get('/helper/payments').expect(200);
      expect(mine.body.pendingTotal).toBe(987.65);
      expect(mine.body.earnedThisWeek).toBe(987.65);

      const id = pending.body[0].id;
      await owner().post(`/shop/payments/${id}/pay`).expect(201);
      await owner().post(`/shop/payments/${id}/pay`).expect(409);
      await as('ownerB').post(`/shop/payments/${id}/pay`).expect(404);
    });
  });

  describe('ayudantes', () => {
    let helperId: string;
    const phone = '5530000001';

    it('el dueño da de alta un ayudante que entra con su teléfono', async () => {
      const res = await owner()
        .post('/shop/helpers', {
          name: 'Pepe',
          phone,
          payType: 'porcentaje',
          payPct: 30,
        })
        .expect(201);
      helperId = res.body.id;
      expect(res.body).toMatchObject({
        payPct: 30,
        payAmount: null,
        active: true,
      });
      const session = await t.login(phone);
      expect(session.user.role).toBe('ayudante');
      tok.pepe = session.accessToken;
      await owner()
        .post('/shop/helpers', {
          name: 'Otro',
          phone,
          payType: 'fijo',
          payAmount: 1,
        })
        .expect(409);
      await owner()
        .post('/shop/helpers', {
          name: 'Sin monto',
          phone: '5530000002',
          payType: 'fijo',
        })
        .expect(400);
    });

    it('el ayudante mueve el trabajo de sus coches, pero no marca Listo', async () => {
      const car = await owner()
        .post('/shop/cars', {
          ...NEW_CAR,
          helperId,
          vehicle: { ...NEW_CAR.vehicle, plates: 'PEPE-1' },
        })
        .expect(201);
      const id = car.body.id;
      const res = await as('pepe')
        .post(`/helper/cars/${id}/state`, { state: 1 })
        .expect(201);
      expect(res.body.allowedNext).toEqual([2, 3]);
      await as('pepe')
        .post(`/helper/cars/${id}/state`, { state: 3 })
        .expect(201);
      await as('pepe')
        .post(`/helper/cars/${id}/state`, { state: 4 })
        .expect(403);
      await as('pepe')
        .post(`/helper/cars/${id}/notes`, { note: 'Avance' })
        .expect(201);
      // coche de otro ayudante
      await as('pepe').get(`/helper/cars/${f.carListo.id}`).expect(404);
      await as('pepe')
        .post(`/helper/cars/${f.carListo.id}/state`, { state: 3 })
        .expect(404);
    });

    it('desactivar al ayudante le corta el acceso al instante', async () => {
      await owner()
        .patch(`/shop/helpers/${helperId}`, { active: false })
        .expect(200);
      await as('pepe').get('/helper/cars').expect(403);
      await t
        .http()
        .post('/auth/verify')
        .send({ phone, code: '123456' })
        .expect(403);
      // y ya no se le pueden asignar coches
      await owner()
        .post('/shop/cars', {
          ...NEW_CAR,
          helperId,
          vehicle: { ...NEW_CAR.vehicle, plates: 'PEPE-2' },
        })
        .expect(400);
    });
  });

  describe('QR y cliente', () => {
    it('regenerar el QR invalida el anterior', async () => {
      const before = f.carDiag.qrToken;
      await t.http().get(`/public/q/${before}`).expect(200);
      const res = await owner()
        .post(`/shop/cars/${f.carDiag.id}/qr`)
        .expect(201);
      expect(res.body.qrToken).not.toBe(before);
      await t.http().get(`/public/q/${before}`).expect(404);
      const ok = await t
        .http()
        .get(`/public/q/${res.body.qrToken}`)
        .expect(200);
      expect(ok.body).toMatchObject({ state: 1, stateName: 'Diagnóstico' });
    });

    it('el QR solo liga la cuenta cuyo teléfono es el del cliente', async () => {
      const qr = (await owner().get(`/shop/cars/${f.carAjeno.id}`).expect(200))
        .body.qrToken;
      const stranger = await t.login('5540000001');
      await t
        .http()
        .post('/client/cars/link')
        .set(t.bearer(stranger.accessToken))
        .send({ token: qr })
        .expect(403);
      await t
        .http()
        .post('/client/cars/link')
        .set(t.bearer(stranger.accessToken))
        .send({ token: 'token-que-no-existe' })
        .expect(404);
    });
  });

  describe('aislamiento en escrituras', () => {
    it('un taller no puede tocar expedientes de otro', async () => {
      const b = as('ownerB');
      const id = f.carListo.id;
      await b.patch(`/shop/cars/${id}`, { km: '1' }).expect(404);
      await b.put(`/shop/cars/${id}/costs`, { items: [] }).expect(404);
      await b.post(`/shop/cars/${id}/state`, { state: 3 }).expect(404);
      await b.post(`/shop/cars/${id}/notes`, { note: 'x' }).expect(404);
      await b.post(`/shop/cars/${id}/qr`).expect(404);
      await b.get(`/shop/vehicles/${vehicleId}`).expect(404);
      await b
        .patch(`/shop/helpers/${f.helper1.id}`, { name: 'Otro nombre' })
        .expect(404);
    });
  });

  describe('admin', () => {
    it('el panel general solo trae conteos', async () => {
      const res = await as('admin').get('/admin/stats').expect(200);
      expect(Object.keys(res.body).sort()).toEqual([
        'carsByMonth',
        'clients',
        'shops',
      ]);
      expect(res.body.shops.activo).toBe(2);
      await as('admin').get('/shop/cars').expect(403);
      await owner().get('/admin/stats').expect(403);
    });
  });
});
