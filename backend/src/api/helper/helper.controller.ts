import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Not } from 'typeorm';
import type { AuthUser } from '../../auth/auth-user.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { CarsService } from '../../modules/cars/cars.service.js';
import { HelpersService } from '../../modules/helpers/helpers.service.js';
import { LogDto, StateDto } from '../common/dto.js';
import { helperCarDetail, helperCarSummary, helperPayments } from './views.js';

/** El ayudante solo alcanza los coches asignados a él en su taller. */
@Roles('ayudante')
@Controller('helper')
export class HelperController {
  constructor(
    private readonly cars: CarsService,
    private readonly helpers: HelpersService,
  ) {}

  private async scope(user: AuthUser) {
    const helper = await this.helpers.forUser(user.id);
    return { shopId: helper.shopId, helperId: helper.id };
  }

  /** Mis coches: los asignados que siguen en el taller. */
  @Get('cars')
  async list(@CurrentUser() user: AuthUser) {
    const cars = await this.cars.find({
      ...(await this.scope(user)),
      state: Not(5),
    });
    return cars.map(helperCarSummary);
  }

  @Get('cars/:id')
  async get(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return helperCarDetail(
      await this.cars.bundle({ id, ...(await this.scope(user)) }),
    );
  }

  @Post('cars/:id/state')
  async state(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StateDto,
  ) {
    const { state, ...log } = dto;
    return helperCarDetail(
      await this.cars.changeState(
        user,
        { id, ...(await this.scope(user)) },
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
    return helperCarDetail(
      await this.cars.addNote(user, { id, ...(await this.scope(user)) }, dto),
    );
  }

  /** Mis pagos: lo de la semana, lo pendiente y lo estimado de los coches en curso. */
  @Get('payments')
  async payments(@CurrentUser() user: AuthUser) {
    const helper = await this.helpers.forUser(user.id);
    return helperPayments(await this.helpers.summary(helper));
  }
}
