/**
 * Datos de demostración: talleres, ayudantes, clientes y expedientes en distintas etapas.
 * Pasa por los mismos servicios que la API (alta de taller, ayudantes, expedientes, costos,
 * etapas), así que la demo usa la lógica real. Se corre con `npm run db:seed:demo`.
 * No hace nada si ya existe el taller de demostración, y nunca corre en producción.
 */
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module.js';
import type { AuthUser } from '../auth/auth-user.js';
import { INSPECTION_POINTS } from '../common/inspection.js';
import { normalizePhone } from '../common/phone.js';
import {
  type CostInput,
  type CreateCarInput,
  CarsService,
} from '../modules/cars/cars.service.js';
import type { CarState } from '../common/enums.js';
import { HelpersService } from '../modules/helpers/helpers.service.js';
import { ShopsService } from '../modules/shops/shops.service.js';
import { User } from '../modules/users/user.entity.js';

if (process.env.NODE_ENV === 'production') {
  console.error('El seed de demostración no corre en producción.');
  process.exit(1);
}

const SHOPS = [
  {
    name: 'Tecnocar-Pro',
    owner: 'César',
    phone: '55 1000 0001',
    zone: 'Iztapalapa',
    address: 'Av. Ermita Iztapalapa 120',
    specialties: ['Mecánica', 'Eléctrica', 'Cerrajería'],
    hours: 'L–S 9:00 a 19:00',
    lat: 19.3589,
    lng: -99.0846,
    status: 'activo' as const,
  },
  {
    name: 'Frenos y Clutch Ramírez',
    owner: 'Hugo Ramírez',
    phone: '55 1000 0002',
    zone: 'Tláhuac',
    address: 'Av. Tláhuac 2210',
    specialties: ['Frenos', 'Suspensión'],
    hours: 'L–S 9:00 a 18:00',
    lat: 19.3205,
    lng: -99.063,
    status: 'activo' as const,
  },
  {
    name: 'Eléctrico Automotriz Aztlán',
    owner: 'Marco Aztlán',
    phone: '55 1000 0003',
    zone: 'Coyoacán',
    address: 'Calz. del Hueso 540',
    specialties: ['Eléctrica', 'Aire acondicionado'],
    hours: 'L–S 9:00 a 20:00',
    lat: 19.3045,
    lng: -99.1355,
    status: 'activo' as const,
  },
  {
    name: 'Mofles Solís',
    owner: 'Raúl Solís',
    phone: '55 1000 0004',
    zone: 'Iztacalco',
    address: 'Av. Té 88',
    specialties: ['Escapes'],
    hours: 'L–V 9:00 a 17:00',
    lat: 19.3925,
    lng: -99.109,
    status: 'pausado' as const,
  },
  {
    name: 'Taller Gómez',
    owner: 'Ricardo Gómez',
    phone: '55 4821 0093',
    zone: 'Xochimilco',
    address: 'Av. Guadalupe I. Ramírez 412',
    specialties: ['Mecánica'],
    hours: 'L–S 9:00 a 19:00',
    lat: 19.2625,
    lng: -99.104,
    status: 'invitado' as const,
  },
];

const inspection = (damaged: string[] = []) =>
  Object.fromEntries(
    INSPECTION_POINTS.map((p) => [p, damaged.includes(p) ? 1 : 0]),
  ) as Record<string, 0 | 1 | 2>;
const SIGNATURE = {
  w: 320,
  h: 130,
  strokes: [
    'M30.0,90.0 L60.0,40.0 L80.0,95.0 L110.0,45.0 L130.0,90.0',
    'M150.0,70.0 L190.0,68.0 L230.0,75.0 L280.0,60.0',
  ],
};

const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ['error', 'warn'],
});
const db = app.get(DataSource);
const shops = app.get(ShopsService);
const helpers = app.get(HelpersService);
const cars = app.get(CarsService);

const ownerPhone = normalizePhone(SHOPS[0]!.phone);
if (await db.getRepository(User).existsBy({ phone: ownerPhone })) {
  console.log('Los datos de demostración ya existen; no se agregó nada.');
  await app.close();
  process.exit(0);
}

for (const s of SHOPS) {
  const { status, ...dto } = s;
  const shop = await shops.create(dto);
  if (status !== 'invitado') await shops.setStatus(shop.id, status);
}
const shop = await db
  .getRepository(User)
  .findOneByOrFail({ phone: ownerPhone })
  .then((owner) => ({ owner, shopId: owner.shopId! }));
const owner: AuthUser = {
  id: shop.owner.id,
  role: 'taller',
  name: shop.owner.name,
  shopId: shop.shopId,
};

const jl = await helpers.create(shop.shopId, {
  name: 'José Luis Ortega',
  phone: '55 6610 2231',
  payType: 'fijo',
  payAmount: 450,
});
const ma = await helpers.create(shop.shopId, {
  name: 'Miguel Ángel Reyes',
  phone: '55 9042 1187',
  payType: 'porcentaje',
  payPct: 30,
});
const helperUser = (h: typeof jl): AuthUser => ({
  id: h.userId!,
  role: 'ayudante',
  name: h.name,
  shopId: shop.shopId,
});

/** Crea un expediente firmado, le pone costos y lo lleva por las etapas indicadas. */
async function car(
  input: CreateCarInput,
  costs: CostInput[],
  path: { to: CarState; note?: string; by?: AuthUser }[],
) {
  const created = await cars.create(owner, shop.shopId, input);
  const id = created.car.id;
  await cars.sign(shop.shopId, id, SIGNATURE);
  for (const step of path) {
    // Los costos se capturan antes de marcar Listo, como en el taller.
    if (step.to === 4 && costs.length)
      await cars.replaceCosts(shop.shopId, id, costs);
    await cars.changeState(
      step.by ?? owner,
      { id, shopId: shop.shopId },
      step.to,
      {
        note: step.note,
      },
    );
  }
  if (costs.length && !path.some((s) => s.to === 4))
    await cars.replaceCosts(shop.shopId, id, costs);
  return id;
}

const laura = {
  name: 'Laura Méndez',
  phone: '55 3021 7788',
  address: 'Calle Morelos 15, Iztapalapa',
};

await car(
  {
    client: laura,
    vehicle: {
      brand: 'Honda',
      model: 'CR-V',
      year: '2018',
      color: 'Gris',
      plates: 'NKR-21-34',
      vin: '5J6RW1H58JL001234',
    },
    km: '84200',
    fuel: 0.5,
    inspection: inspection(['Espejos']),
    damages: [
      { id: 1, x: 0.2, y: 0.3, note: 'Rayón en salpicadera', type: 'rayon' },
    ],
    description:
      'Ruido en suspensión delantera al pasar topes. Revisar bujes y amortiguadores.',
    clientDescription: 'Revisión de suspensión delantera.',
    helperId: jl.id,
  },
  [
    {
      kind: 'refaccion',
      desc: 'Bujes de horquilla (par)',
      qty: 1,
      cost: 680,
      price: 950,
      supplier: 'Refaccionaria El Águila',
    },
    { kind: 'mano', desc: 'Cambio de bujes', qty: 1, cost: 0, price: 1200 },
  ],
  [
    { to: 1, note: 'Revisando la suspensión.' },
    {
      to: 3,
      note: 'Bujes desgastados; empezamos el cambio.',
      by: helperUser(jl),
    },
  ],
);

await car(
  {
    client: {
      name: 'Jorge Pérez',
      phone: '55 7788 1122',
      address: 'Av. Tláhuac 300',
    },
    vehicle: {
      brand: 'Nissan',
      model: 'Versa',
      year: '2020',
      color: 'Blanco',
      plates: 'MXA-90-12',
    },
    km: '45100',
    fuel: 0.75,
    inspection: inspection(),
    description: 'Servicio mayor: aceite, filtros y bujías.',
    clientDescription: 'Servicio mayor.',
    helperId: ma.id,
  },
  [
    {
      kind: 'refaccion',
      desc: 'Aceite sintético 5W-30',
      qty: 4,
      cost: 140,
      price: 190,
      supplier: 'Lubricantes del Sur',
    },
    {
      kind: 'refaccion',
      desc: 'Juego de filtros',
      qty: 1,
      cost: 320,
      price: 450,
    },
    { kind: 'refaccion', desc: 'Bujías iridio', qty: 4, cost: 110, price: 160 },
    { kind: 'mano', desc: 'Servicio mayor', qty: 1, cost: 0, price: 1400 },
    { kind: 'gasto', desc: 'Desengrasante', qty: 1, cost: 60, price: 0 },
  ],
  [
    { to: 1 },
    { to: 3, by: helperUser(ma) },
    { to: 4, note: 'Listo: se cambió aceite, filtros y bujías.' },
  ],
);

await car(
  {
    client: {
      name: 'Ana Torres',
      phone: '55 4455 6677',
      address: 'Calz. Ermita 900',
    },
    vehicle: {
      brand: 'Volkswagen',
      model: 'Jetta',
      year: '2016',
      color: 'Rojo',
      plates: 'PTR-55-01',
    },
    km: '120300',
    fuel: 0.25,
    inspection: inspection(['Luces', 'Batería']),
    description: 'No enciende en frío; revisar batería y marcha.',
    clientDescription: 'Falla al encender.',
    helperId: ma.id,
  },
  [],
  [{ to: 1, note: 'Haciendo pruebas de carga.' }],
);

await car(
  {
    client: laura,
    vehicle: {
      brand: 'Ford',
      model: 'Figo',
      year: '2017',
      color: 'Azul',
      plates: 'LMN-10-20',
    },
    km: '98000',
    fuel: 0.5,
    inspection: inspection(),
    description: 'Cambio de balatas delanteras.',
    clientDescription: 'Frenos delanteros.',
    helperId: jl.id,
  },
  [
    {
      kind: 'refaccion',
      desc: 'Balatas delanteras',
      qty: 1,
      cost: 420,
      price: 650,
    },
    { kind: 'mano', desc: 'Cambio de balatas', qty: 1, cost: 0, price: 600 },
  ],
  [
    { to: 1 },
    { to: 3 },
    { to: 4, note: 'Frenos nuevos y probados.' },
    { to: 5, note: 'Entregado al cliente.' },
  ],
);

await app.close();

console.log(`Datos de demostración creados. Entra con el código DEV_OTP_CODE y uno de estos teléfonos:
  Admin master:        ${process.env.ADMIN_PHONE ?? '(ADMIN_PHONE)'}
  Taller (César):      55 1000 0001
  Ayudante José Luis:  55 6610 2231
  Ayudante Miguel Á.:  55 9042 1187
  Cliente Laura:       55 3021 7788  (tiene 2 coches: CR-V en reparación y Figo entregado)
  Cliente Jorge:       55 7788 1122  (Versa listo para entrega)`);
