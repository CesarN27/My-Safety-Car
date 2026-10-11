import type { DataSourceOptions } from 'typeorm';
import { entities } from './entities.js';

/** Configuración compartida por la app (Nest) y la CLI de migraciones. */
export function dbConfig(
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USER ?? 'tecnocar',
    password: env.DB_PASSWORD ?? 'tecnocar',
    database: env.DB_NAME ?? 'tecnocar',
    entities,
    migrations: [new URL('./migrations/*.js', import.meta.url).pathname],
    // Nunca synchronize: el esquema cambia solo con migraciones.
    synchronize: false,
  };
}
