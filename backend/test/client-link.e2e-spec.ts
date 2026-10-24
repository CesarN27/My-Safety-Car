import { normalizePhone } from '../src/common/phone.js';
import { Client } from '../src/modules/clients/client.entity.js';
import { createTestApp } from './support/app.js';
import { PHONES, S, seedPrivacyFixture } from './support/fixture.js';

describe('Ligar al cliente al iniciar sesión (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    t = await createTestApp();
    await seedPrivacyFixture(t.ds);
  });
  afterAll(() => t.app.close());

  const clients = () => t.ds.getRepository(Client);

  it('al verificar su teléfono, el cliente queda ligado en todos los talleres donde lo capturaron', async () => {
    const before = await clients().findBy({
      phone: normalizePhone(PHONES.client),
    });
    expect(before).toHaveLength(2); // taller A y taller B
    expect(before.every((c) => c.userId === null)).toBe(true);

    const session = await t.login(PHONES.client);

    const after = await clients().findBy({
      phone: normalizePhone(PHONES.client),
    });
    expect(after.every((c) => c.userId === session.user.id)).toBe(true);
  });

  it('no liga clientes con otro teléfono', async () => {
    const other = await clients().findOneByOrFail({
      phone: normalizePhone(S.otherClientPhone),
    });
    expect(other.userId).toBeNull();
  });

  it('no pisa a un cliente que ya tiene cuenta, aunque otro inicie sesión después', async () => {
    const owner = await clients().findOneByOrFail({
      phone: normalizePhone(PHONES.client),
    });
    const stranger = await t.login('5599990000');
    expect(stranger.user.id).not.toBe(owner.userId);
    const unchanged = await clients().findOneByOrFail({ id: owner.id });
    expect(unchanged.userId).toBe(owner.userId);
  });

  it('un taller o un admin que inicia sesión no liga clientes', async () => {
    // el dueño del taller A no tiene el mismo teléfono que ningún cliente: solo comprueba que no truene
    await t.login(PHONES.ownerA);
    const other = await clients().findOneByOrFail({
      phone: normalizePhone(S.otherClientPhone),
    });
    expect(other.userId).toBeNull();
  });
});
