import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource, type FindOptionsWhere } from 'typeorm';
import type { AuthUser } from '../../auth/auth-user.js';
import type { FileKind } from '../../common/enums.js';
import { CarLog } from '../cars/car-log.entity.js';
import { Car } from '../cars/car.entity.js';
import { Helper } from '../helpers/helper.entity.js';
import { IMAGE_TYPES, sniffImage } from './image-type.js';
import { Storage } from './storage.js';
import { StoredFile } from './stored-file.entity.js';

/** Lo mínimo que se usa del archivo que entrega multer (sin depender de @types/multer). */
export interface UploadedImage {
  buffer: Buffer;
  size: number;
}

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_FILES_PER_CAR = 100;

export type CarFileKind = Extract<
  FileKind,
  'entrada' | 'pieza_danada' | 'pieza_nueva' | 'avance'
>;

export interface CarUpload {
  kind: CarFileKind;
  /** Obligatorio con kind avance: la entrada de la bitácora a la que pertenece la foto. */
  logId?: string;
  visibleToClient?: boolean;
}

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly db: DataSource,
    private readonly storage: Storage,
  ) {}

  /**
   * Foto de un expediente. `carWhere` es el filtro de acceso de quien sube (taller: id + shopId;
   * ayudante: además helperId). El expediente debe seguir abierto.
   */
  async uploadToCar(
    user: AuthUser,
    carWhere: FindOptionsWhere<Car>,
    meta: CarUpload,
    file: UploadedImage | undefined,
  ) {
    const car = await this.db.getRepository(Car).findOneBy(carWhere);
    if (!car) throw new NotFoundException('Expediente no encontrado');
    if (car.state === 5)
      throw new ConflictException('El expediente ya se entregó');

    let carLogId: string | null = null;
    if (meta.kind === 'avance') {
      if (!meta.logId)
        throw new BadRequestException('logId es obligatorio con kind avance');
      const log = await this.db
        .getRepository(CarLog)
        .findOneBy({ id: meta.logId, carId: car.id });
      if (!log)
        throw new BadRequestException('Entrada de bitácora no encontrada');
      carLogId = log.id;
    } else if (meta.logId) {
      throw new BadRequestException('logId solo aplica con kind avance');
    }

    const count = await this.db
      .getRepository(StoredFile)
      .countBy({ carId: car.id });
    if (count >= MAX_FILES_PER_CAR)
      throw new ConflictException(
        `El expediente ya tiene ${MAX_FILES_PER_CAR} fotos`,
      );

    return this.store(user, file, {
      shopId: car.shopId,
      kind: meta.kind,
      carId: car.id,
      carLogId,
      helperId: null,
      visibleToClient: meta.visibleToClient ?? false,
    });
  }

  /** Foto del ayudante; reemplaza la anterior. */
  async uploadHelperPhoto(
    user: AuthUser,
    shopId: string,
    helperId: string,
    file: UploadedImage | undefined,
  ) {
    const helper = await this.db
      .getRepository(Helper)
      .findOneBy({ id: helperId, shopId });
    if (!helper) throw new NotFoundException('Ayudante no encontrado');
    const previous = await this.db
      .getRepository(StoredFile)
      .findBy({ helperId, shopId, kind: 'ayudante' });
    const saved = await this.store(user, file, {
      shopId,
      kind: 'ayudante',
      carId: null,
      carLogId: null,
      helperId,
      visibleToClient: false,
    });
    for (const old of previous) await this.removeRow(old);
    return saved;
  }

  /** Foto vigente de cada ayudante del taller: helperId → id del archivo. */
  async helperPhotos(shopId: string) {
    const rows = await this.db
      .getRepository(StoredFile)
      .findBy({ shopId, kind: 'ayudante' });
    return new Map(rows.map((f) => [f.helperId!, f.id]));
  }

  /** Foto que cumple el filtro de acceso de quien la pide, con su contenido; 404 si no la alcanza. */
  async read(where: FindOptionsWhere<StoredFile>) {
    const file = await this.db.getRepository(StoredFile).findOneBy(where);
    if (!file) throw new NotFoundException('Archivo no encontrado');
    return { file, data: await this.storage.read(file.key) };
  }

  async setVisibility(shopId: string, id: string, visibleToClient: boolean) {
    const repo = this.db.getRepository(StoredFile);
    const file = await repo.findOneBy({ id, shopId });
    if (!file?.carId) throw new NotFoundException('Archivo no encontrado');
    await repo.update({ id }, { visibleToClient });
    return repo.findOneByOrFail({ id });
  }

  /** Borra una foto de un expediente abierto (o la de un ayudante). */
  async remove(shopId: string, id: string) {
    const file = await this.db
      .getRepository(StoredFile)
      .findOne({ where: { id, shopId }, relations: { car: true } });
    if (!file) throw new NotFoundException('Archivo no encontrado');
    if (file.car?.state === 5)
      throw new ConflictException('El expediente ya se entregó');
    await this.removeRow(file);
  }

  private async store(
    user: AuthUser,
    file: UploadedImage | undefined,
    row: Omit<
      StoredFile,
      'id' | 'key' | 'mimeType' | 'size' | 'createdAt' | 'uploadedById'
    >,
  ) {
    if (!file?.buffer?.length)
      throw new BadRequestException('Falta la imagen (campo "file")');
    if (file.size > MAX_IMAGE_BYTES)
      throw new PayloadTooLargeException('La imagen pesa más de 10 MB');
    const mimeType = sniffImage(file.buffer);
    if (!mimeType)
      throw new BadRequestException(
        'Solo se aceptan imágenes JPEG, PNG, WebP o HEIC',
      );

    const key = `${row.shopId}/${randomUUID()}.${IMAGE_TYPES[mimeType]}`;
    await this.storage.put(key, file.buffer);
    try {
      return await this.db.getRepository(StoredFile).save({
        ...row,
        key,
        mimeType,
        size: file.buffer.length,
        uploadedById: user.id,
      });
    } catch (err) {
      // Sin fila no hay forma de llegar al archivo: se borra para no dejar basura.
      await this.storage.delete(key);
      throw err;
    }
  }

  private async removeRow(file: StoredFile) {
    await this.db.getRepository(StoredFile).delete({ id: file.id });
    try {
      await this.storage.delete(file.key);
    } catch (err) {
      // La fila ya no existe, así que nadie puede pedir el archivo; solo queda ocupando espacio.
      this.logger.warn(`No se pudo borrar ${file.key}: ${String(err)}`);
    }
  }
}
