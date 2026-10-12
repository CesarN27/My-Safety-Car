import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { normalizePhone } from '../../common/phone.js';
import { Shop } from '../shops/shop.entity.js';
import { User } from './user.entity.js';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  /** Crea el primer admin master desde ADMIN_PHONE si todavía no existe ninguno. */
  async onModuleInit() {
    const phone = this.config.get<string>('ADMIN_PHONE');
    if (!phone) return;
    if (await this.users.existsBy({ role: 'admin' })) return;
    await this.users.save(
      this.users.create({
        phone: normalizePhone(phone),
        name: this.config.get<string>('ADMIN_NAME') ?? 'Admin',
        role: 'admin',
        shopId: null,
      }),
    );
    this.logger.log('Admin inicial creado desde ADMIN_PHONE');
  }

  findByPhone(phone: string) {
    return this.users.findOneBy({ phone });
  }

  /** Usuario con su taller, para decidir si puede operar (cuenta y taller activos). */
  findForSession(id: string) {
    return this.users.findOne({ where: { id }, relations: { shop: true } });
  }

  createClient(phone: string, name: string) {
    return this.users.save(
      this.users.create({ phone, name, role: 'cliente', shopId: null }),
    );
  }

  /** Cuenta de acceso del dueño de un taller; la usa el alta de talleres dentro de su transacción. */
  createShopOwner(
    shop: Shop,
    phone: string,
    name: string,
    repo: Repository<User> = this.users,
  ) {
    return repo.save(
      repo.create({ phone, name, role: 'taller', shopId: shop.id }),
    );
  }
}
