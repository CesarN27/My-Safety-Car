import { StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';
import type { Response } from 'express';
import {
  type CarFileKind,
  MAX_IMAGE_BYTES,
} from '../../modules/files/files.service.js';
import type { StoredFile } from '../../modules/files/stored-file.entity.js';

/** Una sola imagen en el campo `file`, en memoria y con tope de tamaño (multer responde 413). */
export const ImageUpload = () =>
  FileInterceptor('file', {
    limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 5, parts: 6 },
  });

const CAR_KINDS: CarFileKind[] = [
  'entrada',
  'pieza_danada',
  'pieza_nueva',
  'avance',
];

/** Campos de texto que acompañan la imagen en el multipart. */
export class CarUploadDto {
  @IsIn(CAR_KINDS) kind: CarFileKind;
  @IsOptional() @IsUUID() logId?: string;
  /** Llega como texto en el multipart: "true" o "false". */
  @IsOptional()
  @IsIn(['true', 'false'])
  visibleToClient?: 'true' | 'false';
}

export class VisibilityDto {
  @IsBoolean() visibleToClient: boolean;
}

/** Entrega una foto con su tipo real; privada y sin caché compartida. */
export function sendImage(
  res: Response,
  { file, data }: { file: StoredFile; data: Buffer },
) {
  res.setHeader('Cache-Control', 'private, max-age=300');
  return new StreamableFile(data, {
    type: file.mimeType,
    disposition: 'inline',
    length: data.length,
  });
}
