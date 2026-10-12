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
    // Nunca synchronize fuera de pruebas: el esquema cambia solo con migraciones.
    synchronize: false,
    ...(env.NODE_ENV === 'test' ? testOverrides(env) : {}),
  };
}

/** Las pruebas e2e recrean el esquema en cada corrida, así que solo se permite en una base *_test. */
function testOverrides(env: NodeJS.ProcessEnv) {
  if (!env.DB_NAME?.endsWith('_test')) {
    throw new Error(
      'Las pruebas solo pueden correr contra una base cuyo nombre termine en _test',
    );
  }
  return { synchronize: true, dropSchema: true, migrations: [] };
}
