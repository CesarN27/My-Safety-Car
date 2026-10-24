import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { Not } from 'typeorm';
import type { AuthUser } from '../../auth/auth-user.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { CarsService } from '../../modules/cars/cars.service.js';
import {
  FilesService,
  type UploadedImage,
} from '../../modules/files/files.service.js';
import { HelpersService } from '../../modules/helpers/helpers.service.js';
import { LogDto, StateDto } from '../common/dto.js';
import { CarUploadDto, ImageUpload, sendImage } from '../common/files.js';
import { helperCarDetail, helperCarSummary, helperPayments } from './views.js';

/** El ayudante solo alcanza los coches asignados a él en su taller. */
@Roles('ayudante')
@Controller('helper')
export class HelperController {
  constructor(
    private readonly cars: CarsService,
    private readonly helpers: HelpersService,
    private readonly files: FilesService,
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

  /**
   * Sube una foto de avance o de las piezas. Nunca queda visible para el cliente:
   * eso lo decide el dueño (PDF: "fotos que el taller decida compartir").
   */
  @Post('cars/:id/files')
  @UseInterceptors(ImageUpload())
  async upload(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CarUploadDto,
    @UploadedFile() file: UploadedImage | undefined,
  ) {
    const saved = await this.files.uploadToCar(
      user,
      { id, ...(await this.scope(user)) },
      { kind: dto.kind, logId: dto.logId, visibleToClient: false },
      file,
    );
    return {
      id: saved.id,
      kind: saved.kind,
      logId: saved.carLogId,
      mimeType: saved.mimeType,
      size: saved.size,
      createdAt: saved.createdAt,
    };
  }

  /** Fotos de los coches asignados a él. */
  @Get('files/:id/content')
  async content(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { shopId, helperId } = await this.scope(user);
    return sendImage(
      res,
      await this.files.read({ id, shopId, car: { helperId, shopId } }),
    );
  }

  /** Mis pagos: lo de la semana, lo pendiente y lo estimado de los coches en curso. */
  @Get('payments')
  async payments(@CurrentUser() user: AuthUser) {
    const helper = await this.helpers.forUser(user.id);
    return helperPayments(await this.helpers.summary(helper));
  }
}
