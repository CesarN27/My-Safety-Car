const REQUIRED = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'DEV_OTP_CODE',
] as const;

/** Falla al arrancar si falta o es débil alguna variable: nunca se usan valores por defecto. */
export function validateEnv(env: Record<string, unknown>) {
  const missing = REQUIRED.filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(
      `Faltan variables de entorno: ${missing.join(', ')} (copia .env.example a .env)`,
    );
  }
  if (Number.isNaN(Number(env.DB_PORT)))
    throw new Error('DB_PORT debe ser un número');
  if (String(env.JWT_SECRET).length < 32)
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
  if (env.NODE_ENV === 'production' && env.DEV_OTP_CODE) {
    throw new Error(
      'DEV_OTP_CODE no debe existir en producción: configura un canal de login real',
    );
  }
  return env;
}
