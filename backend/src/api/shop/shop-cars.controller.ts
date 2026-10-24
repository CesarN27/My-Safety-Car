import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Not } from 'typeorm';
import type { AuthUser } from '../../auth/auth-user.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { CarsService } from '../../modules/cars/cars.service.js';
import { ClientsService } from '../../modules/clients/clients.service.js';
import { LogDto, StateDto } from '../common/dto.js';
import { shopOf } from '../common/session.js';
import {
  CarListQuery,
  CostsDto,
  CreateCarDto,
  ReportQuery,
  UpdateCarDto,
  VehicleSearchQuery,
} from './dto.js';
import { shopCarDetail, shopCarSummary, shopVehicle } from './views.js';

/** Expedientes del taller: todo filtrado por el taller de la sesión. */
@Roles('taller')
@Controller('shop')
export class ShopCarsController {
  constructor(
    private readonly cars: CarsService,
    private readonly clients: ClientsService,
  ) {}

  /** Tablero: sin filtro, los coches que siguen en el taller; con `state`, solo esa etapa. */
  @Get('cars')
  async list(@CurrentUser() user: AuthUser, @Query() q: CarListQuery) {
    const shopId = shopOf(user);
    const rows = await this.cars.findWithTotals({
      shopId,
      state: q.state ?? Not(5),
    });
    return rows.map(({ car, totals }) => shopCarSummary(car, totals));
  }

  @Get('cars/:id')
  async get(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return shopCarDetail(await this.cars.bundle({ id, shopId: shopOf(user) }));
  }

  @Post('cars')
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateCarDto) {
    return shopCarDetail(await this.cars.create(user, shopOf(user), dto));
  }

  @Patch('cars/:id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCarDto,
  ) {
    return shopCarDetail(await this.cars.update(shopOf(user), id, dto));
  }

  @Put('cars/:id/costs')
  async costs(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CostsDto,
  ) {
    return shopCarDetail(
      await this.cars.replaceCosts(shopOf(user), id, dto.items, dto.ivaOn),
    );
  }

  @Post('cars/:id/state')
  async state(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StateDto,
  ) {
    const { state, ...log } = dto;
    return shopCarDetail(
      await this.cars.changeState(
        user,
        { id, shopId: shopOf(user) },
        state,
        log,
      ),
    );
  }

  @Post('cars/:id/notes')
  async note(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LogDto,
  ) {
    return shopCarDetail(
      await this.cars.addNote(user, { id, shopId: shopOf(user) }, dto),
    );
  }

  /** Genera un QR nuevo; el anterior deja de servir. */
  @Post('cars/:id/qr')
  async rotateQr(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return shopCarDetail(await this.cars.rotateQr(shopOf(user), id));
  }

  @Get('vehicles')
  async searchVehicles(
    @CurrentUser() user: AuthUser,
    @Query() q: VehicleSearchQuery,
  ) {
    const found = await this.clients.searchVehicles(shopOf(user), q.q);
    return found.map((v) => shopVehicle(v, []));
  }

  @Get('vehicles/:id')
  async vehicle(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const { vehicle, visits } = await this.clients.vehicleWithVisits(
      shopOf(user),
      id,
    );
    return shopVehicle(vehicle, visits);
  }

  /** Ingresos, refacciones, gastos, pagos a ayudantes y ganancia de los coches entregados en [from, to). */
  @Get('reports')
  async report(@CurrentUser() user: AuthUser, @Query() q: ReportQuery) {
    const rows = await this.cars.deliveredBetween(
      shopOf(user),
      new Date(`${q.from}T00:00:00`),
      new Date(`${q.to}T00:00:00`),
    );
    const keys = [
      'subtotal',
      'iva',
      'total',
      'parts',
      'expenses',
      'helperPay',
      'profit',
    ] as const;
    const sums = Object.fromEntries(
      keys.map((k) => [
        k,
        rows.reduce((acc, r) => acc + Math.round(r.totals[k] * 100), 0) / 100,
      ]),
    );
    return { from: q.from, to: q.to, cars: rows.length, ...sums };
  }
}
