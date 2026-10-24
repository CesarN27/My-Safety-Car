import type { StoredFile } from '../../modules/files/stored-file.entity.js';
import type { CarLog } from '../../modules/cars/car-log.entity.js';
import type { Car } from '../../modules/cars/car.entity.js';

/**
 * Piezas de respuesta que comparten varias superficies. Cada vista se arma campo por campo:
 * nunca se devuelve una entidad tal cual, para que una columna nueva no se filtre sola.
 */

export const vehicleBasics = (car: Car) => ({
  brand: car.vehicle!.brand,
  model: car.vehicle!.model,
  year: car.vehicle!.year,
  color: car.vehicle!.color,
  plates: car.vehicle!.plates,
});

/** Bitácora completa (taller y ayudante). */
export const fullLog = (log: CarLog[]) =>
  log.map((l) => ({
    id: l.id,
    fromState: l.fromState,
    state: l.state,
    at: l.at,
    authorName: l.authorName,
    note: l.note,
    visibleToClient: l.visibleToClient,
  }));

/** Metadatos de una foto; el contenido se pide aparte a `/<superficie>/files/:id/content`. */
export const fileView = (f: StoredFile) => ({
  id: f.id,
  kind: f.kind,
  logId: f.carLogId,
  visibleToClient: f.visibleToClient,
  label: f.label,
  mimeType: f.mimeType,
  size: f.size,
  createdAt: f.createdAt,
});
