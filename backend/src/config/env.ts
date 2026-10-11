const REQUIRED = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
] as const;

/** Falla al arrancar si falta alguna variable: nunca se usan credenciales por defecto. */
export function validateEnv(env: Record<string, unknown>) {
  const missing = REQUIRED.filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(
      `Faltan variables de entorno: ${missing.join(', ')} (copia .env.example a .env)`,
    );
  }
  if (Number.isNaN(Number(env.DB_PORT)))
    throw new Error('DB_PORT debe ser un número');
  return env;
}
