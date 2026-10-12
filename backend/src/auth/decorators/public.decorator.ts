import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';
/** Marca una ruta como accesible sin sesión; todo lo demás exige token. */
export const Public = () => SetMetadata(IS_PUBLIC, true);
