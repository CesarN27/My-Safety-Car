import type { Car } from '../../modules/cars/car.entity.js';
import type { CarBundle } from '../../modules/cars/cars.service.js';
import type { Totals } from '../../modules/pricing/pricing.js';
import { vehicleBasics } from '../common/views.js';

/**
 * Vistas del cliente: su coche, el total solo desde "Listo para entrega" y nunca el desglose,
 * los costos, la ganancia ni lo que se le paga al ayudante. La bitácora, solo lo marcado visible.
 */

const READY = 4;

/** El total aparece hasta que el coche está listo (PDF: "el total aparece solo en Listo"). */
const visibleTotal = (car: Car, totals: Totals) =>
  car.state >= READY ? totals.total : null;

export const clientCarSummary = (car: Car, totals: Totals) => ({
  id: car.id,
  folio: car.folio,
  state: car.state,
  enteredAt: car.enteredAt,
  deliveredAt: car.deliveredAt,
  shop: {
    name: car.shop!.name,
    phone: car.shop!.phone,
    address: car.shop!.address,
  },
  vehicle: vehicleBasics(car),
  total: visibleTotal(car, totals),
});

export const clientCarDetail = ({ car, log, files, totals }: CarBundle) => {
  const visibleLog = log.filter((l) => l.visibleToClient);
  const visibleLogIds = new Set(visibleLog.map((l) => l.id));
  return {
    ...clientCarSummary(car, totals),
    description: car.clientDescription,
    client: {
      name: car.client!.name,
      phone: car.client!.phone,
      address: car.client!.address,
    },
    timeline: visibleLog.map((l) => ({
      id: l.id,
      state: l.state,
      at: l.at,
      note: l.note,
    })),
    // Solo las fotos marcadas como visibles, y las de avance solo si su nota también lo es.
    files: files
      .filter(
        (f) =>
          f.visibleToClient && (!f.carLogId || visibleLogIds.has(f.carLogId)),
      )
      .map((f) => ({
        id: f.id,
        kind: f.kind,
        logId: f.carLogId,
        createdAt: f.createdAt,
      })),
    /** Cuándo firmó y qué cláusulas aceptó (son suyas); los trazos no hacen falta. */
    signedAt: car.signedAt,
    signedClauses: car.signedClauses,
  };
};
