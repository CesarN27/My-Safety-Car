import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, type EntityManager, IsNull, Repository } from 'typeorm';
import { normalizePhone } from '../../common/phone.js';
import { Car } from '../cars/car.entity.js';
import { User } from '../users/user.entity.js';
import { Client } from './client.entity.js';
import { Vehicle } from './vehicle.entity.js';

export interface ClientInput {
  name: string;
  phone: string;
  address?: string;
}

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client) private readonly clients: Repository<Client>,
    private readonly db: DataSource,
  ) {}

  /**
   * Liga a la cuenta todos los clientes (de cualquier taller) capturados con ese teléfono.
   * Solo se llama después de verificar el teléfono con el código, así que quien entra es
   * de verdad el dueño del número. No pisa clientes que ya tienen cuenta.
   */
  async linkAccount(userId: string, phone: string) {
    await this.clients.update({ phone, userId: IsNull() }, { userId });
  }

  /** Vehículos del taller por placas, VIN o teléfono del cliente (para abrir una visita de regreso). */
  searchVehicles(shopId: string, q: string) {
    const text = `%${q
      .trim()
      .toUpperCase()
      .replace(/[%_\\]/g, '\\$&')}%`;
    const digits = q.replace(/\D/g, '');
    const qb = this.db
      .getRepository(Vehicle)
      .createQueryBuilder('v')
      .innerJoinAndSelect('v.client', 'c')
      .where('v.shopId = :shopId', { shopId })
      .andWhere(
        digits.length >= 4
          ? '(v.plates LIKE :text OR v.vin LIKE :text OR c.phone LIKE :digits)'
          : '(v.plates LIKE :text OR v.vin LIKE :text)',
        { text, digits: `%${digits}%` },
      )
      .orderBy('v.createdAt', 'DESC')
      .take(20);
    return qb.getMany();
  }

  /** Vehículo del taller con su historial de visitas en ese taller. */
  async vehicleWithVisits(shopId: string, id: string) {
    const vehicle = await this.db.getRepository(Vehicle).findOne({
      where: { id, shopId },
      relations: { client: true },
    });
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');
    const visits = await this.db.getRepository(Car).find({
      where: { vehicleId: id, shopId },
      order: { enteredAt: 'DESC' },
    });
    return { vehicle, visits };
  }

  /**
   * Cliente del taller con ese teléfono; lo crea si no existe y, si existe, actualiza nombre y
   * domicilio con lo recién capturado. Si el teléfono ya tiene cuenta de cliente, queda ligado
   * en el momento (el teléfono de esa cuenta ya se verificó al crearla).
   */
  async findOrCreate(
    tx: EntityManager,
    shopId: string,
    input: ClientInput,
  ): Promise<Client> {
    const phone = normalizePhone(input.phone);
    const account = await tx.findOneBy(User, { phone, role: 'cliente' });
    // Dos altas simultáneas con el mismo cliente nuevo no deben chocar: ON CONFLICT espera a la
    // otra transacción y no inserta; el SELECT siguiente ya ve la fila confirmada.
    await tx
      .createQueryBuilder()
      .insert()
      .into(Client)
      .values({
        shopId,
        phone,
        name: input.name,
        address: input.address ?? '',
        userId: account?.id ?? null,
      })
      .orIgnore()
      .execute();
    const client = await tx.findOneByOrFail(Client, { shopId, phone });
    client.name = input.name;
    if (input.address !== undefined) client.address = input.address;
    client.userId ??= account?.id ?? null;
    return tx.save(Client, client);
  }
}
