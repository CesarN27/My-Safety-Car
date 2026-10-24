import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { Storage } from './storage.js';

/** Fotos en disco bajo STORAGE_DIR. No se sirve como estático: todo pasa por la API con permisos. */
@Injectable()
export class LocalDiskStorage extends Storage {
  private readonly root: string;

  constructor(config: ConfigService) {
    super();
    this.root = resolve(config.getOrThrow<string>('STORAGE_DIR'));
  }

  /** Ruta absoluta de una clave; rechaza cualquier clave que salga de la raíz (`../`, absolutas). */
  private path(key: string) {
    const full = resolve(this.root, key);
    if (!full.startsWith(this.root + sep))
      throw new Error(`Clave de almacenamiento inválida: ${key}`);
    return full;
  }

  async put(key: string, data: Buffer) {
    const full = this.path(key);
    await mkdir(dirname(full), { recursive: true });
    // wx: nunca sobrescribe un archivo existente.
    await writeFile(full, data, { flag: 'wx' });
  }

  read(key: string) {
    return readFile(this.path(key));
  }

  async delete(key: string) {
    await rm(this.path(key), { force: true });
  }
}
