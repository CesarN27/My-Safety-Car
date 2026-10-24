import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DataSource, IsNull } from 'typeorm';
import { Public } from '../../auth/decorators/public.decorator.js';
import { CarLog } from '../../modules/cars/car-log.entity.js';
import { STATE_NAMES } from '../../modules/cars/car-state.js';
import { Car } from '../../modules/cars/car.entity.js';
import { Shop } from '../../modules/shops/shop.entity.js';

/**
 * Página del QR sin cuenta (PDF: "si no tiene la app, abre una página con el estado").
 * Quien tenga el link ve solo la etapa y cuándo cambió: nada de dinero, datos personales,
 * placas ni notas. Deja de funcionar al entregar el coche o al regenerar el QR.
 */
@Public()
@Controller('public')
export class PublicController {
  constructor(private readonly db: DataSource) {}

  /** Talleres activos para el mapa del cliente: solo su perfil público. */
  @Get('shops')
  async shops() {
    const shops = await this.db
      .getRepository(Shop)
      .find({ where: { status: 'activo' }, order: { name: 'ASC' } });
    return shops.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      zone: s.zone,
      address: s.address,
      specialties: s.specialties,
      hours: s.hours,
      verified: s.verified,
      lat: s.lat,
      lng: s.lng,
    }));
  }

  // Más estricto que el límite general: el token es lo único que protege esta ruta.
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get('q/:token')
  async status(@Param('token') token: string) {
    if (token.length < 10 || token.length > 100)
      throw new NotFoundException('Ese código ya no es válido');
    const car = await this.db.getRepository(Car).findOne({
      where: { qrToken: token, deliveredAt: IsNull() },
      relations: { shop: true, vehicle: true },
    });
    if (!car) throw new NotFoundException('Ese código ya no es válido');
    const log = await this.db.getRepository(CarLog).find({
      where: { carId: car.id, visibleToClient: true },
      order: { at: 'ASC' },
    });
    return {
      state: car.state,
      stateName: STATE_NAMES[car.state],
      shop: { name: car.shop!.name, phone: car.shop!.phone },
      vehicle: { brand: car.vehicle!.brand, model: car.vehicle!.model },
      updatedAt: car.updatedAt,
      // Solo cambios de etapa, sin notas.
      timeline: log
        .filter((l) => l.fromState !== null || l.state === 0)
        .filter((l, i, all) => i === 0 || l.state !== all[i - 1]!.state)
        .map((l) => ({ state: l.state, at: l.at })),
    };
  }
}
