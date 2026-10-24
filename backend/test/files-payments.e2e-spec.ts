import type { FileKind } from '../src/common/enums.js';
import { CarLog } from '../src/modules/cars/car-log.entity.js';
import { StoredFile } from '../src/modules/files/stored-file.entity.js';
import { HelperPayment } from '../src/modules/helpers/helper-payment.entity.js';
import { Helper } from '../src/modules/helpers/helper.entity.js';
import { createTestApp } from './support/app.js';
import { seedPrivacyFixture, type PrivacyFixture } from './support/fixture.js';

describe('Archivos y pagos a ayudantes (esquema)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let f: PrivacyFixture;
  let seq = 0;

  beforeAll(async () => {
    t = await createTestApp();
    f = await seedPrivacyFixture(t.ds);
  });
  afterAll(() => t.app.close());

  const file = (kind: FileKind, over: Partial<StoredFile>) =>
    t.ds.getRepository(StoredFile).save({
      shopId: f.shopA.id,
      kind,
      key: `prueba/${++seq}.jpg`,
      mimeType: 'image/jpeg',
      size: 1000,
      ...over,
    });
  const logOf = (carId: string) =>
    t.ds.getRepository(CarLog).save({ carId, state: 1, authorName: 'Prueba' });
  const payment = (over: Partial<HelperPayment>) =>
    t.ds.getRepository(HelperPayment).save({
      shopId: f.shopA.id,
      carId: f.carListo.id,
      helperId: f.helper1.id,
      amount: 100,
      ...over,
    });

  describe('files', () => {
    it('acepta cada tipo con su dueño correcto', async () => {
      const log = await logOf(f.carListo.id);
      await file('entrada', { carId: f.carListo.id, visibleToClient: true });
      await file('pieza_danada', { carId: f.carListo.id });
      await file('avance', { carId: f.carListo.id, carLogId: log.id });
      await file('ayudante', { helperId: f.helper1.id });
      await file('taller', {});
    });

    it('rechaza archivos cuyo dueño no corresponde a su tipo', async () => {
      await expect(file('entrada', {})).rejects.toThrow();
      await expect(file('avance', { carId: f.carListo.id })).rejects.toThrow();
      await expect(
        file('ayudante', { helperId: f.helper1.id, carId: f.carListo.id }),
      ).rejects.toThrow();
      await expect(file('taller', { carId: f.carListo.id })).rejects.toThrow();
    });

    it('rechaza archivos que mezclan talleres o coches', async () => {
      // coche del taller B registrado como archivo del taller A
      await expect(file('entrada', { carId: f.carB.id })).rejects.toThrow();
      // ayudante del taller A registrado como archivo del taller B
      await expect(
        file('ayudante', { shopId: f.shopB.id, helperId: f.helper1.id }),
      ).rejects.toThrow();
      // foto de avance de una bitácora que es de otro coche
      const otherLog = await logOf(f.carDiag.id);
      await expect(
        file('avance', { carId: f.carListo.id, carLogId: otherLog.id }),
      ).rejects.toThrow();
    });

    it('no repite claves de almacenamiento', async () => {
      const a = await file('taller', {});
      await expect(file('taller', { key: a.key })).rejects.toThrow();
    });
  });

  describe('helper_payments', () => {
    it('un pago por ayudante y coche, y nunca negativo', async () => {
      await payment({});
      await expect(payment({})).rejects.toThrow();
      await expect(
        payment({ carId: f.carDiag.id, amount: -1 }),
      ).rejects.toThrow();
    });

    it('rechaza pagos que mezclan talleres', async () => {
      await expect(payment({ carId: f.carB.id })).rejects.toThrow();
      await expect(
        payment({ shopId: f.shopB.id, carId: f.carB.id }),
      ).rejects.toThrow();
    });

    it('no deja borrar a un ayudante con historial de pagos', async () => {
      await expect(
        t.ds.getRepository(Helper).delete({ id: f.helper1.id }),
      ).rejects.toThrow();
    });
  });
});
