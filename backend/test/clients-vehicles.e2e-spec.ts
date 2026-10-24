import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { Car } from '../src/modules/cars/car.entity.js';
import { Client } from '../src/modules/clients/client.entity.js';
import { Vehicle } from '../src/modules/clients/vehicle.entity.js';
import { Shop } from '../src/modules/shops/shop.entity.js';

describe('Clientes, vehículos y expedientes (esquema)', () => {
  let ds: DataSource;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    ds = app.get(DataSource);
    close = () => app.close();
  });
  afterAll(() => close());

  const newShop = (name: string) =>
    ds.getRepository(Shop).save({
      name,
      owner: 'Dueño',
      phone: name,
      zone: 'Centro',
      address: 'Calle 1',
      hours: 'L-V 9-18',
      lat: 19.43,
      lng: -99.13,
    });
  const newClient = (shopId: string, phone = '5512345678') =>
    ds.getRepository(Client).save({ shopId, name: 'Ana', phone });
  const newVehicle = (shopId: string, clientId: string) =>
    ds.getRepository(Vehicle).save({
      shopId,
      clientId,
      brand: 'VW',
      model: 'Jetta',
      year: '2015',
      color: 'Gris',
      plates: 'ABC123',
    });
  const newCar = (
    shopId: string,
    vehicleId: string,
    clientId: string,
    folio: string,
  ) =>
    ds.getRepository(Car).save({
      shopId,
      vehicleId,
      clientId,
      folio,
      qrToken: `qr-${shopId}-${folio}`,
      km: '100',
    });

  it('un vehículo acumula varios expedientes (historial de visitas)', async () => {
    const shop = await newShop('A1');
    const client = await newClient(shop.id);
    const vehicle = await newVehicle(shop.id, client.id);
    await newCar(shop.id, vehicle.id, client.id, '1');
    await newCar(shop.id, vehicle.id, client.id, '2');
    const visits = await ds
      .getRepository(Car)
      .countBy({ vehicleId: vehicle.id });
    expect(visits).toBe(2);
  });

  it('el mismo teléfono puede ser cliente de dos talleres, pero no dos veces en el mismo', async () => {
    const [a, b] = [await newShop('A2'), await newShop('B2')];
    await newClient(a.id, '5599999999');
    await newClient(b.id, '5599999999');
    await expect(newClient(a.id, '5599999999')).rejects.toThrow();
  });

  it('la base rechaza un expediente que mezcle talleres', async () => {
    const [a, b] = [await newShop('A3'), await newShop('B3')];
    const clientA = await newClient(a.id);
    const vehicleA = await newVehicle(a.id, clientA.id);
    const clientB = await newClient(b.id);
    const vehicleB = await newVehicle(b.id, clientB.id);
    // vehículo de otro taller
    await expect(newCar(a.id, vehicleB.id, clientA.id, '1')).rejects.toThrow();
    // cliente de otro taller
    await expect(newCar(a.id, vehicleA.id, clientB.id, '2')).rejects.toThrow();
    // vehículo de un cliente de otro taller
    await expect(newVehicle(a.id, clientB.id)).rejects.toThrow();
  });
});
