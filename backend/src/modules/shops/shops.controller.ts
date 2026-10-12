import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { CreateShopDto, UpdateShopStatusDto } from './dto/shop.dto.js';
import { ShopsService } from './shops.service.js';

/** Administración de talleres: solo el admin master. */
@Roles('admin')
@Controller('admin/shops')
export class ShopsController {
  constructor(private readonly shops: ShopsService) {}

  @Get()
  list() {
    return this.shops.findAll();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.shops.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateShopDto) {
    return this.shops.create(dto);
  }

  @Patch(':id/status')
  setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShopStatusDto,
  ) {
    return this.shops.setStatus(id, dto.status);
  }
}
