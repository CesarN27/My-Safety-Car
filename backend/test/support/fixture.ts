import type { DataSource } from 'typeorm';
import { normalizePhone } from '../../src/common/phone.js';
import { Car } from '../../src/modules/cars/car.entity.js';
import { CostItem } from '../../src/modules/cars/cost-item.entity.js';
import { Client } from '../../src/modules/clients/client.entity.js';
import { Vehicle } from '../../src/modules/clients/vehicle.entity.js';
import { Helper } from '../../src/modules/helpers/helper.entity.js';
import { Shop } from '../../src/modules/shops/shop.entity.js';
import { User } from '../../src/modules/users/user.entity.js';

/**
 * Valores sentinela: números y textos que no se parecen a nada más, para poder buscarlos en
 * cualquier respuesta. Si aparecen donde no deben, hay una filtración aunque cambie el nombre del campo.
 */
export const S = {
  partCost: 1234.56,
  partPrice: 2345.67,
  laborPrice: 3456.78,
  expenseCost: 111.11,
  supplier: 'ProveedorSecreto',
  partDesc: 'Pieza Secreta Xyz',
  expenseDesc: 'Gasto Secreto Xyz',
  helperPay: 987.65,
  /** subtotal = partPrice + laborPrice */
  subtotal: 5802.45,
  /** subtotal × 1.16, redondeado a centavos: lo único que el cliente puede ver del dinero */
  total: 6730.84,
  /** subtotal − costo de la pieza − pago al ayudante − gasto */
  profit: 3469.13,
  /** coche en diagnóstico: aún no hay total para el cliente */
  diagPrice: 333.33,
  diagCost: 222.22,
  otherClientAddress: 'Otra Calle Privada 7',
  otherClientPhone: '5500000099',
  clientAddress: 'Calle Secreta 99',
} as const;

/** Todo lo que el ayudante y el cliente jamás deben recibir. */
export const MONEY_VALUES = [
  S.partCost,
  S.partPrice,
  S.laborPrice,
  S.expenseCost,
  S.supplier,
  S.partDesc,
  S.expenseDesc,
  S.subtotal,
  S.profit,
] as const;

export const PHONES = {
  ownerA: '5510000001',
  ownerB: '5510000002',
  helper1: '5510000011',
  helper2: '5510000012',
  client: '5510000021',
} as const;

export interface PrivacyFixture {
  shopA: Shop;
  shopB: Shop;
  /** Ayudantes del taller A. */
  helper1: Helper;
  helper2: Helper;
  /** Listo para entrega (4), asignado al ayudante 1, con costos y total. */
  carListo: Car;
  /** En diagnóstico (1), asignado al ayudante 1, con costos capturados. */
  carDiag: Car;
  /** Del taller A pero de otro cliente y otro ayudante. */
  carAjeno: Car;
  /** De otro taller. */
  carB: Car;
}

let seq = 0;

/** Siembra dos talleres con dueños, ayudantes, un cliente y coches en distintos estados. */
export async function seedPrivacyFixture(
  ds: DataSource,
): Promise<PrivacyFixture> {
  const shopOf = (name: string, phone: string) =>
    ds.getRepository(Shop).save({
      name,
      owner: `Dueño ${name}`,
      phone: normalizePhone(phone),
      zone: 'Centro',
      address: 'Calle 1',
      hours: 'L-V 9-18',
      lat: 19.43,
      lng: -99.13,
      status: 'activo',
    });
  const user = (
    phone: string,
    name: string,
    role: User['role'],
    shopId: string | null,
  ) =>
    ds.getRepository(User).save({
      phone: normalizePhone(phone),
      name,
      role,
      shopId,
    });

  const shopA = await shopOf('Taller A', PHONES.ownerA);
  const shopB = await shopOf('Taller B', PHONES.ownerB);
  await user(PHONES.ownerA, 'Dueño A', 'taller', shopA.id);
  await user(PHONES.ownerB, 'Dueño B', 'taller', shopB.id);

  const helperOf = async (phone: string, name: string) => {
    const u = await user(phone, name, 'ayudante', shopA.id);
    return ds.getRepository(Helper).save({
      shopId: shopA.id,
      userId: u.id,
      name,
      phone: normalizePhone(phone),
      payType: 'fijo',
      payAmount: S.helperPay,
    });
  };
  const helper1 = await helperOf(PHONES.helper1, 'Ayudante 1');
  const helper2 = await helperOf(PHONES.helper2, 'Ayudante 2');

  // El cliente aún no tiene cuenta ligada: se liga solo al iniciar sesión con su teléfono.
  await user(PHONES.client, 'Cliente', 'cliente', null);
  const clientOf = (
    shopId: string,
    name: string,
    phone: string,
    address: string,
  ) =>
    ds
      .getRepository(Client)
      .save({ shopId, name, phone: normalizePhone(phone), address });
  const clientA = await clientOf(
    shopA.id,
    'Ana',
    PHONES.client,
    S.clientAddress,
  );
  const clientOther = await clientOf(
    shopA.id,
    'Beto',
    S.otherClientPhone,
    S.otherClientAddress,
  );
  const clientB = await clientOf(shopB.id, 'Ana', PHONES.client, 'Domicilio B');

  const carOf = async (
    shopId: string,
    client: Client,
    state: Car['state'],
    helperId: string | null,
    ivaOn: boolean,
  ) => {
    const vehicle = await ds.getRepository(Vehicle).save({
      shopId,
      clientId: client.id,
      brand: 'VW',
      model: 'Jetta',
      year: '2015',
      color: 'Gris',
      plates: `PL${++seq}`,
    });
    return ds.getRepository(Car).save({
      shopId,
      vehicleId: vehicle.id,
      clientId: client.id,
      folio: String(seq),
      qrToken: `qr-privacidad-${seq}`,
      km: '100',
      state,
      helperId,
      ivaOn,
    });
  };
  const costs = (carId: string, items: Partial<CostItem>[]) =>
    ds
      .getRepository(CostItem)
      .save(items.map((i) => ({ carId, ...i })) as CostItem[]);

  const carListo = await carOf(shopA.id, clientA, 4, helper1.id, true);
  await costs(carListo.id, [
    {
      kind: 'refaccion',
      desc: S.partDesc,
      cost: S.partCost,
      price: S.partPrice,
      supplier: S.supplier,
    },
    { kind: 'mano', desc: 'Mano de obra', cost: 0, price: S.laborPrice },
    { kind: 'gasto', desc: S.expenseDesc, cost: S.expenseCost, price: 0 },
  ]);

  const carDiag = await carOf(shopA.id, clientA, 1, helper1.id, false);
  await costs(carDiag.id, [
    { kind: 'mano', desc: 'Diagnóstico', cost: S.diagCost, price: S.diagPrice },
  ]);

  const carAjeno = await carOf(shopA.id, clientOther, 3, helper2.id, true);
  await costs(carAjeno.id, [
    { kind: 'mano', desc: 'Otro trabajo', cost: 1, price: 777.77 },
  ]);

  const carB = await carOf(shopB.id, clientB, 4, null, true);
  await costs(carB.id, [
    { kind: 'refaccion', desc: 'Pieza de B', cost: 555.55, price: 666.66 },
  ]);

  return { shopA, shopB, helper1, helper2, carListo, carDiag, carAjeno, carB };
}
