/** Deja solo dígitos; un número de 10 dígitos se toma como México (52). */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 10 ? `52${digits}` : digits;
}

/** Formato aceptado en la entrada: dígitos con espacios, guiones, paréntesis o "+". */
export const PHONE_PATTERN = /^\+?[\d\s()-]{10,20}$/;
