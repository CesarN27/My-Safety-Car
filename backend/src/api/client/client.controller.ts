import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { DataSource, In, IsNull } from 'typeorm';
import type { AuthUser } from '../../auth/auth-user.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { Car } from '../../modules/cars/car.entity.js';
import { CarsService } from '../../modules/cars/cars.service.js';
import { Client } from '../../modules/clients/client.entity.js';
import { User } from '../../modules/users/user.entity.js';
import { clientCarDetail, clientCarSummary } from './views.js';

class LinkDto {
  @IsString() @MinLength(10) @MaxLength(100) token: string;
}

/**
 * El cliente alcanza los coches de los `clients` ligados a su cuenta, en cualquier taller.
 * El vínculo se hace al verificar su teléfono (AuthService) o al escanear el QR (link).
 */
@Roles('cliente')
@Controller('client')
export class ClientController {
  constructor(
    private readonly cars: CarsService,
    private readonly db: DataSource,
  ) {}

  private async clientIds(user: AuthUser) {
    const rows = await this.db
      .getRepository(Client)
      .find({ where: { userId: user.id }, select: { id: true } });
    return rows.map((r) => r.id);
  }

  /** Mis coches, en curso y entregados (es también su historial entre talleres). */
  @Get('cars')
  async list(@CurrentUser() user: AuthUser) {
    const ids = await this.clientIds(user);
    if (!ids.length) return [];
    const rows = await this.cars.findWithTotals({ clientId: In(ids) });
    return rows.map(({ car, totals }) => clientCarSummary(car, totals));
  }

  @Get('cars/:id')
  async get(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const ids = await this.clientIds(user);
    if (!ids.length) throw new NotFoundException('Expediente no encontrado');
    return clientCarDetail(await this.cars.bundle({ id, clientId: In(ids) }));
  }

  /**
   * Escaneo del QR desde la app. Solo liga si el teléfono verificado de la cuenta es el que
   * el cliente dio en el taller; si no, quien escanea tiene que entrar con ese teléfono (PDF).
   */
  @Post('cars/link')
  async link(@CurrentUser() user: AuthUser, @Body() dto: LinkDto) {
    const car = await this.db
      .getRepository(Car)
      .findOne({ where: { qrToken: dto.token, deliveredAt: IsNull() } });
    if (!car) throw new NotFoundException('Ese código ya no es válido');

    const [client, account] = await Promise.all([
      this.db.getRepository(Client).findOneByOrFail({ id: car.clientId }),
      this.db.getRepository(User).findOneByOrFail({ id: user.id }),
    ]);
    if (
      client.phone !== account.phone ||
      (client.userId && client.userId !== user.id)
    )
      throw new ForbiddenException(
        'Este coche está registrado con otro teléfono: entra con el teléfono que diste en el taller',
      );
    if (!client.userId)
      await this.db
        .getRepository(Client)
        .update({ id: client.id, userId: IsNull() }, { userId: user.id });
    return clientCarDetail(await this.cars.bundle({ id: car.id }));
  }
}
