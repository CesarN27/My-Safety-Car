import { SetMetadata } from '@nestjs/common';
import type { Role } from '../../common/enums.js';

export const ROLES_KEY = 'roles';
/** Roles que pueden usar la ruta. Sin este decorador, cualquier rol con sesión entra. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
