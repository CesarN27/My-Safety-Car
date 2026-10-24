import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module.js';
import { setupApp } from '../../src/app.setup.js';

export const CODE = process.env.DEV_OTP_CODE ?? '123456';
export const ADMIN_PHONE = process.env.ADMIN_PHONE ?? '5500000000';

/** Arranca la app completa contra la base de pruebas y da atajos para hacer peticiones. */
export async function createTestApp() {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app: INestApplication = moduleRef.createNestApplication();
  setupApp(app);
  await app.init();
  const http = () => request(app.getHttpServer());
  const login = async (phone: string) => {
    const res = await http()
      .post('/auth/verify')
      .send({ phone, code: CODE })
      .expect(200);
    return res.body as {
      accessToken: string;
      user: { id: string; role: string; shopId: string | null };
    };
  };
  const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });
  return { app, ds: app.get(DataSource), http, login, bearer };
}
