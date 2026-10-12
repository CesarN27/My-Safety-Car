import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { AuthUser } from './auth-user.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { RefreshDto, RequestCodeDto, VerifyCodeDto } from './dto/auth.dto.js';

/** Límite estricto en las rutas de acceso: 5 intentos por minuto y por IP. */
const STRICT = { default: { limit: 5, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle(STRICT)
  @Post('request-code')
  @HttpCode(HttpStatus.NO_CONTENT)
  requestCode(@Body() dto: RequestCodeDto) {
    return this.auth.requestCode(dto);
  }

  @Public()
  @Throttle(STRICT)
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  verify(@Body() dto: VerifyCodeDto) {
    return this.auth.verifyCode(dto);
  }

  @Public()
  @Throttle(STRICT)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
