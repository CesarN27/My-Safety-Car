import { sniffImage } from './image-type.js';

const pad = (head: number[] | string) =>
  Buffer.concat([
    typeof head === 'string' ? Buffer.from(head, 'latin1') : Buffer.from(head),
    Buffer.alloc(16),
  ]);

describe('sniffImage', () => {
  it('reconoce JPEG, PNG, WebP y HEIC por sus bytes', () => {
    expect(sniffImage(pad([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(
      sniffImage(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBe('image/png');
    expect(sniffImage(pad('RIFF\x00\x00\x00\x00WEBP'))).toBe('image/webp');
    expect(sniffImage(pad('\x00\x00\x00\x18ftypheic'))).toBe('image/heic');
  });

  it('rechaza todo lo demás, aunque se llame .jpg', () => {
    expect(
      sniffImage(pad('<svg xmlns="http://www.w3.org/2000/svg">')),
    ).toBeNull();
    expect(sniffImage(pad('<html><script>'))).toBeNull();
    expect(sniffImage(pad('%PDF-1.7'))).toBeNull();
    expect(sniffImage(Buffer.from([0xff, 0xd8]))).toBeNull();
  });
});
