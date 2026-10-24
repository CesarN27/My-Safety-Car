import { ForbiddenException } from '@nestjs/common';
import type { AuthUser } from '../../auth/auth-user.js';

/** Taller de la sesión. Sale siempre de la sesión (leída de la base), nunca de la petición. */
export function shopOf(user: AuthUser): string {
  if (!user.shopId)
    throw new ForbiddenException('La cuenta no pertenece a un taller');
  return user.shopId;
}
