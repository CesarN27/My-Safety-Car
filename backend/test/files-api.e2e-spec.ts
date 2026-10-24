import { createTestApp } from './support/app.js';
import {
  PHONES,
  seedPrivacyFixture,
  type PrivacyFixture,
} from './support/fixture.js';

/** Bytes mínimos de un PNG válido (la API detecta el tipo por la firma de bytes). */
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(64, 1),
]);
const SIG = { w: 300, h: 130, strokes: ['M10.0,20.0 L11.5,22.0 L30.0,40.0'] };

describe('Fotos y firma (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let f: PrivacyFixture;
  const tok: Record<string, string> = {};
  const auth = (who: string) => t.bearer(tok[who]!);

  beforeAll(async () => {
    t = await createTestApp();
    f = await seedPrivacyFixture(t.ds);
    for (const [who, phone] of Object.entries({
      ownerA: PHONES.ownerA,
      ownerB: PHONES.ownerB,
      helper1: PHONES.helper1,
      helper2: PHONES.helper2,
      client: PHONES.client,
    }))
      tok[who] = (await t.login(phone)).accessToken;
  });
  afterAll(() => t.app.close());

  const upload = (
    who: string,
    path: string,
    fields: Record<string, string>,
    data = PNG,
  ) => {
    const req = t.http().post(path).set(auth(who));
    for (const [k, v] of Object.entries(fields)) req.field(k, v);
    return req.attach('file', data, 'foto.png');
  };

  let visibleId: string;
  let hiddenId: string;

  it('el taller sube fotos; el tipo se detecta por los bytes, no por el nombre', async () => {
    const car = `/shop/cars/${f.carListo.id}/files`;
    const a = await upload('ownerA', car, {
      kind: 'entrada',
      visibleToClient: 'true',
    }).expect(201);
    expect(a.body).toMatchObject({
      kind: 'entrada',
      mimeType: 'image/png',
      visibleToClient: true,
    });
    visibleId = a.body.id;
    hiddenId = (
      await upload('ownerA', car, { kind: 'pieza_danada' }).expect(201)
    ).body.id;

    await upload(
      'ownerA',
      car,
      { kind: 'entrada' },
      Buffer.from('<svg onload="x()"></svg>'.padEnd(40)),
    ).expect(400);
    await upload('ownerA', car, { kind: 'firma' }).expect(400);
    await upload('ownerA', car, { kind: 'avance' }).expect(400); // falta logId
    await t
      .http()
      .post(car)
      .set(auth('ownerA'))
      .field('kind', 'entrada')
      .expect(400); // sin archivo
    await upload('ownerB', car, { kind: 'entrada' }).expect(404);
  });

  it('cada quien descarga solo lo que le toca', async () => {
    const res = await t
      .http()
      .get(`/shop/files/${visibleId}/content`)
      .set(auth('ownerA'))
      .expect(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(Buffer.from(res.body as Buffer).equals(PNG)).toBe(true);

    await t
      .http()
      .get(`/shop/files/${visibleId}/content`)
      .set(auth('ownerB'))
      .expect(404);
    await t
      .http()
      .get(`/helper/files/${hiddenId}/content`)
      .set(auth('helper1'))
      .expect(200);
    await t
      .http()
      .get(`/helper/files/${hiddenId}/content`)
      .set(auth('helper2'))
      .expect(404);
    await t
      .http()
      .get(`/client/files/${visibleId}/content`)
      .set(auth('client'))
      .expect(200);
    await t
      .http()
      .get(`/client/files/${hiddenId}/content`)
      .set(auth('client'))
      .expect(404);
    await t.http().get(`/shop/files/${visibleId}/content`).expect(401);
  });

  it('el cliente ve en su expediente solo las fotos visibles; el taller decide', async () => {
    const before = await t
      .http()
      .get(`/client/cars/${f.carListo.id}`)
      .set(auth('client'))
      .expect(200);
    expect(before.body.files.map((x: { id: string }) => x.id)).toEqual([
      visibleId,
    ]);

    await t
      .http()
      .patch(`/shop/files/${hiddenId}`)
      .set(auth('ownerA'))
      .send({ visibleToClient: true })
      .expect(200);
    await t
      .http()
      .get(`/client/files/${hiddenId}/content`)
      .set(auth('client'))
      .expect(200);
    await t
      .http()
      .delete(`/shop/files/${hiddenId}`)
      .set(auth('ownerA'))
      .expect(204);
    await t
      .http()
      .get(`/shop/files/${hiddenId}/content`)
      .set(auth('ownerA'))
      .expect(404);
  });

  it('el ayudante sube fotos de avance a sus coches, nunca visibles para el cliente', async () => {
    const note = await t
      .http()
      .post(`/helper/cars/${f.carDiag.id}/notes`)
      .set(auth('helper1'))
      .send({ note: 'Avance' })
      .expect(201);
    const logId = note.body.log.at(-1).id as string;
    const res = await upload('helper1', `/helper/cars/${f.carDiag.id}/files`, {
      kind: 'avance',
      logId,
      visibleToClient: 'true',
    }).expect(201);
    expect(res.body.logId).toBe(logId);
    const shopView = await t
      .http()
      .get(`/shop/cars/${f.carDiag.id}`)
      .set(auth('ownerA'))
      .expect(200);
    expect(
      shopView.body.files.find((x: { id: string }) => x.id === res.body.id)
        .visibleToClient,
    ).toBe(false);

    await upload('helper1', `/helper/cars/${f.carAjeno.id}/files`, {
      kind: 'entrada',
    }).expect(404);
  });

  it('firma: solo trazos válidos, guarda las cláusulas aceptadas y no se rehace fuera de Recibido', async () => {
    await t
      .http()
      .patch('/shop/settings')
      .set(auth('ownerA'))
      .send({ clauses: 'Garantía de 15 días.' })
      .expect(200);
    const path = `/shop/cars/${f.carDiag.id}/signature`;
    await t
      .http()
      .put(path)
      .set(auth('ownerA'))
      .send({ ...SIG, strokes: ['M1,1" onload="alert(1)'] })
      .expect(400);
    const res = await t
      .http()
      .put(path)
      .set(auth('ownerA'))
      .send(SIG)
      .expect(200);
    expect(res.body).toMatchObject({
      signature: SIG,
      signedClauses: 'Garantía de 15 días.',
      signed: true,
    });

    // carDiag está en Diagnóstico: ya no se puede volver a firmar
    await t.http().put(path).set(auth('ownerA')).send(SIG).expect(409);
    await t.http().put(path).set(auth('ownerB')).send(SIG).expect(404);

    const client = await t
      .http()
      .get(`/client/cars/${f.carDiag.id}`)
      .set(auth('client'))
      .expect(200);
    expect(client.body.signedClauses).toBe('Garantía de 15 días.');
    expect(client.body.signature).toBeUndefined();
  });

  it('foto del ayudante: reemplaza la anterior', async () => {
    const path = `/shop/helpers/${f.helper1.id}/photo`;
    const first = await upload('ownerA', path, {}).expect(201);
    const second = await upload('ownerA', path, {}).expect(201);
    expect(second.body.photoId).not.toBe(first.body.photoId);
    await t
      .http()
      .get(`/shop/files/${first.body.photoId}/content`)
      .set(auth('ownerA'))
      .expect(404);
    await t
      .http()
      .get(`/shop/files/${second.body.photoId}/content`)
      .set(auth('ownerA'))
      .expect(200);
    await upload('ownerB', path, {}).expect(404);
  });
});
