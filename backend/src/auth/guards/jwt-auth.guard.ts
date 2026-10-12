import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../modules/users/users.service.js';
import { canOperate } from '../auth.service.js';
import type { AuthUser } from '../auth-user.js';
import { IS_PUBLIC } from '../decorators/public.decorator.js';

/**
 * Guard global: toda ruta exige sesión salvo las marcadas con @Public().
 * El rol y el taller se leen de la base en cada petición (no del token), así que
 * desactivar una cuenta o pausar un taller surte efecto de inmediato.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
        ctx.getHandler(),
        ctx.getClass(),
      ])
    )
      return true;

    const req = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: AuthUser;
    }>();
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException();

    let sub: string;
    try {
      ({ sub } = await this.jwt.verifyAsync<{ sub: string }>(token));
    } catch {
      throw new UnauthorizedException();
    }

    const user = await this.users.findForSession(sub);
    if (!user) throw new UnauthorizedException();
    if (!canOperate(user)) throw new ForbiddenException('Cuenta desactivada');

    req.user = {
      id: user.id,
      role: user.role,
      name: user.name,
      shopId: user.shopId,
    };
    return true;
  }
}
