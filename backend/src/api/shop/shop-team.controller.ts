import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { IsNull, Not } from 'typeorm';
import type { AuthUser } from '../../auth/auth-user.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import {
  FilesService,
  type UploadedImage,
} from '../../modules/files/files.service.js';
import { HelpersService } from '../../modules/helpers/helpers.service.js';
import { ShopsService } from '../../modules/shops/shops.service.js';
import { ImageUpload } from '../common/files.js';
import { shopOf } from '../common/session.js';
import {
  HelperDto,
  PaymentsQuery,
  ShopSettingsDto,
  UpdateHelperDto,
} from './dto.js';
import { shopHelper, shopPayment, shopSettings } from './views.js';

/** Ayudantes, sus pagos y los ajustes del taller. */
@Roles('taller')
@Controller('shop')
export class ShopTeamController {
  constructor(
    private readonly helpers: HelpersService,
    private readonly shops: ShopsService,
    private readonly files: FilesService,
  ) {}

  @Get('helpers')
  async list(@CurrentUser() user: AuthUser) {
    const shopId = shopOf(user);
    const [helpers, photos] = await Promise.all([
      this.helpers.list(shopId),
      this.files.helperPhotos(shopId),
    ]);
    return helpers.map((h) => shopHelper(h, photos.get(h.id) ?? null));
  }

  /** Foto del ayudante (multipart, campo `file`); reemplaza la anterior. Se ve en /shop/files/:id/content. */
  @Post('helpers/:id/photo')
  @UseInterceptors(ImageUpload())
  async photo(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadedImage | undefined,
  ) {
    const shopId = shopOf(user);
    const saved = await this.files.uploadHelperPhoto(user, shopId, id, file);
    return shopHelper(await this.helpers.findOne(shopId, id), saved.id);
  }

  /** Alta del ayudante con su cuenta: entra con su propio teléfono. */
  @Post('helpers')
  async create(@CurrentUser() user: AuthUser, @Body() dto: HelperDto) {
    return shopHelper(await this.helpers.create(shopOf(user), dto));
  }

  @Patch('helpers/:id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHelperDto,
  ) {
    return shopHelper(await this.helpers.update(shopOf(user), id, dto));
  }

  @Get('payments')
  async payments(@CurrentUser() user: AuthUser, @Query() q: PaymentsQuery) {
    const rows = await this.helpers.payments({
      shopId: shopOf(user),
      ...(q.helperId ? { helperId: q.helperId } : {}),
      ...(q.pending === 'true'
        ? { paidAt: IsNull() }
        : q.pending === 'false'
          ? { paidAt: Not(IsNull()) }
          : {}),
    });
    return rows.map(shopPayment);
  }

  @Post('payments/:id/pay')
  async pay(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return shopPayment(await this.helpers.markPaid(shopOf(user), id));
  }

  @Get('settings')
  async settings(@CurrentUser() user: AuthUser) {
    return shopSettings(await this.shops.findOne(shopOf(user)));
  }

  @Patch('settings')
  async updateSettings(
    @CurrentUser() user: AuthUser,
    @Body() dto: ShopSettingsDto,
  ) {
    return shopSettings(await this.shops.updateSettings(shopOf(user), dto));
  }
}
