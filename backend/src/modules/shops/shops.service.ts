import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DEFAULT_CLAUSES } from '../../common/clauses.js';
import type { ShopStatus } from '../../common/enums.js';
import { normalizePhone } from '../../common/phone.js';
import { User } from '../users/user.entity.js';
import type { CreateShopDto } from './dto/shop.dto.js';
import { Shop } from './shop.entity.js';

@Injectable()
export class ShopsService {
  constructor(
    @InjectRepository(Shop) private readonly shops: Repository<Shop>,
    private readonly db: DataSource,
  ) {}

  findAll() {
    return this.shops.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const shop = await this.shops.findOneBy({ id });
    if (!shop) throw new NotFoundException('Taller no encontrado');
    return shop;
  }

  /** Alta de un taller y de la cuenta de su dueño, en una sola transacción. */
  async create(dto: CreateShopDto) {
    const phone = normalizePhone(dto.phone);
    return this.db.transaction(async (tx) => {
      if (await tx.existsBy(User, { phone }))
        throw new ConflictException('Ese teléfono ya tiene una cuenta');
      const shop = await tx.save(
        Shop,
        tx.create(Shop, {
          name: dto.name,
          owner: dto.owner,
          phone,
          zone: dto.zone,
          address: dto.address,
          specialties: dto.specialties,
          hours: dto.hours,
          lat: dto.lat,
          lng: dto.lng,
          status: 'invitado',
          verified: false,
          clauses: DEFAULT_CLAUSES,
        }),
      );
      await tx.save(
        User,
        tx.create(User, {
          phone,
          name: dto.owner,
          role: 'taller',
          shopId: shop.id,
        }),
      );
      return shop;
    });
  }

  /** Ajustes que el dueño cambia de su propio taller. */
  async updateSettings(
    id: string,
    changes: Partial<
      Pick<Shop, 'ivaPct' | 'hours' | 'specialties' | 'clauses'>
    >,
  ) {
    if (Object.keys(changes).length) await this.shops.update({ id }, changes);
    return this.findOne(id);
  }

  async setStatus(id: string, status: ShopStatus) {
    const shop = await this.findOne(id);
    shop.status = status;
    return this.shops.save(shop);
  }
}
