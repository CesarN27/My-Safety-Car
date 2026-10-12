import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';
import { normalizePhone } from '../common/phone.js';
import type { User } from '../modules/users/user.entity.js';
import { UsersService } from '../modules/users/users.service.js';
import type { RequestCodeDto, VerifyCodeDto } from './dto/auth.dto.js';
import { OtpProvider } from './otp/otp-provider.js';
import { RefreshToken } from './refresh-token.entity.js';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

/** La cuenta está activa y su taller (si tiene) no está pausado. */
export function canOperate(user: User): boolean {
  return user.active && user.shop?.status !== 'pausado';
}

@Injectable()
export class AuthService {
  private readonly refreshDays: number;

  constructor(
    private readonly users: UsersService,
    private readonly otp: OtpProvider,
    private readonly jwt: JwtService,
    config: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
  ) {
    this.refreshDays = Number(config.get('REFRESH_TOKEN_DAYS') ?? 30);
  }

  /** Responde igual exista o no la cuenta, para no revelar qué teléfonos están registrados. */
  async requestCode({ phone }: RequestCodeDto) {
    await this.otp.send(normalizePhone(phone));
  }

  async verifyCode({ phone, code, name }: VerifyCodeDto) {
    const normalized = normalizePhone(phone);
    if (!(await this.otp.verify(normalized, code)))
      throw new UnauthorizedException('Código incorrecto');

    // Solo los clientes se registran solos; taller, ayudante y admin los crea otra persona.
    let user = await this.users.findByPhone(normalized);
    if (!user)
      user = await this.users.createClient(
        normalized,
        name?.trim() || 'Cliente',
      );

    const full = await this.users.findForSession(user.id);
    if (!full || !canOperate(full))
      throw new ForbiddenException('Cuenta desactivada');
    return this.issueSession(full);
  }

  async refresh(token: string) {
    const stored = await this.refreshTokens.findOneBy({
      tokenHash: sha256(token),
    });
    if (!stored) throw new UnauthorizedException('Sesión inválida');

    if (stored.revokedAt) {
      // Un token ya usado que vuelve a aparecer puede ser robado: se cierran todas las sesiones.
      await this.refreshTokens.update(
        { userId: stored.userId, revokedAt: IsNull() },
        { revokedAt: new Date() },
      );
      throw new UnauthorizedException('Sesión inválida');
    }
    if (stored.expiresAt < new Date())
      throw new UnauthorizedException('Sesión expirada');

    // La condición revokedAt IS NULL evita que dos peticiones simultáneas usen el mismo token.
    const { affected } = await this.refreshTokens.update(
      { id: stored.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    if (!affected) throw new UnauthorizedException('Sesión inválida');

    const user = await this.users.findForSession(stored.userId);
    if (!user || !canOperate(user))
      throw new ForbiddenException('Cuenta desactivada');
    return this.issueSession(user);
  }

  async logout(token: string) {
    await this.refreshTokens.update(
      { tokenHash: sha256(token), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  private async issueSession(user: User) {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
    });
    const refreshToken = randomBytes(32).toString('base64url');
    await this.refreshTokens.save(
      this.refreshTokens.create({
        userId: user.id,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshDays * 86_400_000),
        revokedAt: null,
      }),
    );
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        shopId: user.shopId,
      },
    };
  }
}
