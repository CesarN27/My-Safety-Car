import type { ValueTransformer } from 'typeorm';

/** Postgres devuelve numeric como string; el dominio trabaja con number. */
export const numeric: ValueTransformer = {
  to: (v?: number | null) => v,
  from: (v?: string | null) => (v == null ? v : Number(v)),
};
