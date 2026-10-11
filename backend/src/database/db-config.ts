import type { DataSourceOptions } from 'typeorm';
import { entities } from './entities.js';

/** Configuración compartida por la app (Nest) y la CLI de migraciones. */
export function dbConfig(
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    entities,
    migrations: [new URL('./migrations/*.js', import.meta.url).pathname],
    // Nunca synchronize: el esquema cambia solo con migraciones.
    synchronize: false,
  };
}
