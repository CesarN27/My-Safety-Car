/** Tipos de imagen aceptados, detectados por sus primeros bytes (nunca por lo que diga el cliente). */
export const IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
} as const;
export type ImageMime = keyof typeof IMAGE_TYPES;

const ascii = (buf: Buffer, start: number, end: number) =>
  buf.subarray(start, end).toString('latin1');

export function sniffImage(buf: Buffer): ImageMime | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return 'image/jpeg';
  if (
    buf
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return 'image/png';
  if (ascii(buf, 0, 4) === 'RIFF' && ascii(buf, 8, 12) === 'WEBP')
    return 'image/webp';
  // HEIC/HEIF (fotos de iPhone): caja ftyp con una marca de imagen.
  if (
    ascii(buf, 4, 8) === 'ftyp' &&
    ['heic', 'heix', 'mif1', 'msf1', 'heis'].includes(ascii(buf, 8, 12))
  )
    return 'image/heic';
  return null;
}
