import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/app.setup.js';

const CODE = process.env.DEV_OTP_CODE ?? '123456';
const ADMIN_PHONE = process.env.ADMIN_PHONE ?? '5500000000';

const shopBody = (phone: string) => ({
  name: 'Taller Prueba',
  owner: 'Dueño Prueba',
  phone,
  zone: 'Centro',
  address: 'Calle 1',
  specialties: ['Mecánica'],
  hours: 'L-V 9-18',
  lat: 19.43,
  lng: -99.13,
});

describe('Auth, roles y alta de talleres (e2e)', () => {
  let app: INestApplication;
  const http = () => request(app.getHttpServer());

  const login = async (phone: string) => {
    const res = await http()
      .post('/auth/verify')
      .send({ phone, code: CODE })
      .expect(200);
    return res.body as {
      accessToken: string;
      refreshToken: string;
      user: { id: string; role: string; shopId: string | null };
    };
  };
  const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });
  afterAll(() => app.close());

  it('/health es público', () => http().get('/health').expect(200));

  it('rechaza rutas protegidas sin token o con token inválido', async () => {
    await http().get('/auth/me').expect(401);
    await http().get('/auth/me').set(bearer('no.es.un.jwt')).expect(401);
    await http().get('/admin/shops').expect(401);
  });

  it('rechaza un código incorrecto sin crear la cuenta', async () => {
    await http()
      .post('/auth/verify')
      .send({ phone: '5511111111', code: '000000' })
      .expect(401);
    // el mismo teléfono con el código bueno entra como cliente nuevo, así que antes no existía
    const s = await login('5511111111');
    expect(s.user.role).toBe('cliente');
  });

  it('request-code responde igual exista o no la cuenta', async () => {
    await http()
      .post('/auth/request-code')
      .send({ phone: ADMIN_PHONE })
      .expect(204);
    await http()
      .post('/auth/request-code')
      .send({ phone: '5599999999' })
      .expect(204);
  });

  it('valida teléfonos y campos desconocidos', async () => {
    await http().post('/auth/request-code').send({ phone: 'abc' }).expect(400);
    await http()
      .post('/auth/verify')
      .send({ phone: '5511111111', code: CODE, role: 'admin' })
      .expect(400);
  });

  it('un cliente nuevo no puede volverse admin ni usar rutas de admin', async () => {
    const client = await login('5522222222');
    await http()
      .get('/admin/shops')
      .set(bearer(client.accessToken))
      .expect(403);
    await http()
      .post('/admin/shops')
      .set(bearer(client.accessToken))
      .send(shopBody('5533333333'))
      .expect(403);
  });

  describe('alta de talleres por el admin', () => {
    let adminToken: string;
    let shopId: string;
    const shopPhone = '5544444444';

    beforeAll(async () => {
      adminToken = (await login(ADMIN_PHONE)).accessToken;
    });

    it('el admin crea el taller y su dueño puede entrar', async () => {
      const res = await http()
        .post('/admin/shops')
        .set(bearer(adminToken))
        .send(shopBody(shopPhone))
        .expect(201);
      shopId = res.body.id;
      expect(res.body.status).toBe('invitado');

      const owner = await login(shopPhone);
      expect(owner.user.role).toBe('taller');
      expect(owner.user.shopId).toBe(shopId);
    });

    it('un taller no puede listar ni crear talleres', async () => {
      const owner = await login(shopPhone);
      await http()
        .get('/admin/shops')
        .set(bearer(owner.accessToken))
        .expect(403);
      await http()
        .post('/admin/shops')
        .set(bearer(owner.accessToken))
        .send(shopBody('5555555555'))
        .expect(403);
    });

    it('no repite teléfonos y rechaza datos inválidos', async () => {
      await http()
        .post('/admin/shops')
        .set(bearer(adminToken))
        .send(shopBody(shopPhone))
        .expect(409);
      await http()
        .post('/admin/shops')
        .set(bearer(adminToken))
        .send({ ...shopBody('5566666666'), lat: 200 })
        .expect(400);
      await http()
        .post('/admin/shops')
        .set(bearer(adminToken))
        .send({ ...shopBody('5566666666'), status: 'activo' })
        .expect(400);
    });

    it('pausar el taller bloquea de inmediato a su dueño, incluso con sesión abierta', async () => {
      const owner = await login(shopPhone);
      await http().get('/auth/me').set(bearer(owner.accessToken)).expect(200);

      await http()
        .patch(`/admin/shops/${shopId}/status`)
        .set(bearer(adminToken))
        .send({ status: 'pausado' })
        .expect(200);

      await http().get('/auth/me').set(bearer(owner.accessToken)).expect(403);
      await http()
        .post('/auth/verify')
        .send({ phone: shopPhone, code: CODE })
        .expect(403);
      await http()
        .post('/auth/refresh')
        .send({ refreshToken: owner.refreshToken })
        .expect(403);

      await http()
        .patch(`/admin/shops/${shopId}/status`)
        .set(bearer(adminToken))
        .send({ status: 'activo' })
        .expect(200);
      await login(shopPhone);
    });

    it('rechaza ids que no son UUID', () =>
      http().get('/admin/shops/123').set(bearer(adminToken)).expect(400));
  });

  describe('tokens de refresco', () => {
    it('rota el token y detecta la reutilización de uno viejo', async () => {
      const first = await login('5577777777');
      const second = await http()
        .post('/auth/refresh')
        .send({ refreshToken: first.refreshToken })
        .expect(200);
      expect(second.body.refreshToken).not.toBe(first.refreshToken);

      // reusar el token ya rotado invalida también la sesión nueva
      await http()
        .post('/auth/refresh')
        .send({ refreshToken: first.refreshToken })
        .expect(401);
      await http()
        .post('/auth/refresh')
        .send({ refreshToken: second.body.refreshToken })
        .expect(401);
    });

    it('logout revoca el token de refresco', async () => {
      const s = await login('5588888888');
      await http()
        .post('/auth/logout')
        .send({ refreshToken: s.refreshToken })
        .expect(204);
      await http()
        .post('/auth/refresh')
        .send({ refreshToken: s.refreshToken })
        .expect(401);
    });
  });
});
