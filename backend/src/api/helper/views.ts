import { allowedNext } from '../../modules/cars/car-state.js';
import type { Car } from '../../modules/cars/car.entity.js';
import type { CarBundle } from '../../modules/cars/cars.service.js';
import type { HelperPayment } from '../../modules/helpers/helper-payment.entity.js';
import { fullLog, vehicleBasics } from '../common/views.js';

/**
 * Vistas del ayudante: el trabajo del coche, nunca dinero del expediente (ni costos, ni precios,
 * ni total, ni ganancia). Del cliente solo el nombre. Su propio pago va aparte, en /helper/payments.
 */

/** Etapas a las que el ayudante puede llevar el coche (las de car-state.ts). */
const HELPER_TARGETS = [1, 2, 3];

export const helperCarSummary = (car: Car) => ({
  id: car.id,
  folio: car.folio,
  state: car.state,
  enteredAt: car.enteredAt,
  vehicle: vehicleBasics(car),
  clientName: car.client!.name,
});

export const helperCarDetail = ({ car, log, files }: CarBundle) => ({
  ...helperCarSummary(car),
  km: car.km,
  fuel: car.fuel,
  inspection: car.inspection,
  damages: car.damages,
  description: car.description,
  log: fullLog(log),
  // El ayudante ve todas las fotos del coche (PDF), pero no decide cuáles ve el cliente.
  files: files.map((f) => ({
    id: f.id,
    kind: f.kind,
    logId: f.carLogId,
    mimeType: f.mimeType,
    size: f.size,
    createdAt: f.createdAt,
  })),
  allowedNext: allowedNext(car.state).filter((s) => HELPER_TARGETS.includes(s)),
});

export const helperPayments = (s: {
  payments: HelperPayment[];
  inProgress: { car: Car; estimated: number }[];
  pendingTotal: number;
  earnedThisWeek: number;
}) => ({
  earnedThisWeek: s.earnedThisWeek,
  pendingTotal: s.pendingTotal,
  inProgress: s.inProgress.map(({ car, estimated }) => ({
    carId: car.id,
    folio: car.folio,
    state: car.state,
    estimated,
  })),
  payments: s.payments.map((p) => ({
    id: p.id,
    carId: p.carId,
    folio: p.car!.folio,
    amount: p.amount,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
  })),
});
