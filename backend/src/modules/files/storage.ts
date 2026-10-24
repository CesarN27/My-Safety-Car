/**
 * Dónde viven los bytes de las fotos. Hoy disco local (`LocalDiskStorage`); cambiar a S3 o R2
 * es escribir otra implementación y cambiar el proveedor en `FilesModule`.
 * Las claves las genera siempre el servidor; nunca vienen de la petición.
 */
export abstract class Storage {
  abstract put(key: string, data: Buffer): Promise<void>;
  abstract read(key: string): Promise<Buffer>;
  /** No falla si el archivo ya no existe. */
  abstract delete(key: string): Promise<void>;
}
