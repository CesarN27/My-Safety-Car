import type { Role } from '../common/enums.js';

/** Quién hace la petición; lo arma el guard a partir del usuario en la base, no del token. */
export interface AuthUser {
  id: string;
  role: Role;
  name: string;
  /** Taller al que pertenece; null para admin y cliente. */
  shopId: string | null;
}
