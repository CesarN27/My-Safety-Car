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

export const clientCarDetail = ({ car, log, totals }: CarBundle) => ({
  ...clientCarSummary(car, totals),
  description: car.clientDescription,
  client: {
    name: car.client!.name,
    phone: car.client!.phone,
    address: car.client!.address,
  },
  timeline: log
    .filter((l) => l.visibleToClient)
    .map((l) => ({ state: l.state, at: l.at, note: l.note })),
});
