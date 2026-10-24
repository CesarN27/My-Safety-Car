import type { Client } from '../../modules/clients/client.entity.js';
import type { Vehicle } from '../../modules/clients/vehicle.entity.js';
import { allowedNext } from '../../modules/cars/car-state.js';
import type { Car } from '../../modules/cars/car.entity.js';
import type { CarBundle } from '../../modules/cars/cars.service.js';
import type { HelperPayment } from '../../modules/helpers/helper-payment.entity.js';
import type { Helper } from '../../modules/helpers/helper.entity.js';
import type { Totals } from '../../modules/pricing/pricing.js';
import type { Shop } from '../../modules/shops/shop.entity.js';
import { fileView, fullLog, vehicleBasics } from '../common/views.js';

/** Vistas del dueño del taller: ve todo lo de su taller, incluido el desglose y la ganancia. */

const helperRef = (car: Car) =>
  car.helper ? { id: car.helper.id, name: car.helper.name } : null;

export const shopCarSummary = (car: Car, totals: Totals) => ({
  id: car.id,
  folio: car.folio,
  state: car.state,
  enteredAt: car.enteredAt,
  deliveredAt: car.deliveredAt,
  vehicle: vehicleBasics(car),
  client: { name: car.client!.name, phone: car.client!.phone },
  helper: helperRef(car),
  total: totals.total,
  signed: car.signature !== null,
});

export const shopCarDetail = ({
  car,
  costs,
  log,
  files,
  totals,
}: CarBundle) => ({
  ...shopCarSummary(car, totals),
  qrToken: car.qrToken,
  km: car.km,
  fuel: car.fuel,
  inspection: car.inspection,
  damages: car.damages,
  description: car.description,
  clientDescription: car.clientDescription,
  ivaOn: car.ivaOn,
  ivaPct: car.shop!.ivaPct,
  vehicle: { id: car.vehicleId, ...vehicleBasics(car), vin: car.vehicle!.vin },
  client: shopClient(car.client!),
  costs: costs.map((c) => ({
    id: c.id,
    kind: c.kind,
    desc: c.desc,
    qty: c.qty,
    cost: c.cost,
    price: c.price,
    supplier: c.supplier,
  })),
  totals,
  log: fullLog(log),
  files: files.map(fileView),
  signature: car.signature,
  signedAt: car.signedAt,
  signedClauses: car.signedClauses,
  allowedNext: allowedNext(car.state),
});

export const shopClient = (c: Client) => ({
  id: c.id,
  name: c.name,
  phone: c.phone,
  address: c.address,
  hasAccount: c.userId !== null,
});

export const shopVehicle = (v: Vehicle, visits: Car[]) => ({
  id: v.id,
  brand: v.brand,
  model: v.model,
  year: v.year,
  color: v.color,
  plates: v.plates,
  vin: v.vin,
  client: shopClient(v.client!),
  visits: visits.map((c) => ({
    id: c.id,
    folio: c.folio,
    state: c.state,
    enteredAt: c.enteredAt,
    deliveredAt: c.deliveredAt,
    km: c.km,
  })),
});

export const shopHelper = (h: Helper, photoId: string | null = null) => ({
  id: h.id,
  name: h.name,
  phone: h.phone,
  payType: h.payType,
  payAmount: h.payAmount,
  payPct: h.payPct,
  active: h.user?.active ?? false,
  photoId,
});

export const shopPayment = (p: HelperPayment) => ({
  id: p.id,
  helper: { id: p.helper!.id, name: p.helper!.name },
  car: { id: p.car!.id, folio: p.car!.folio },
  amount: p.amount,
  paidAt: p.paidAt,
  createdAt: p.createdAt,
});

export const shopSettings = (s: Shop) => ({
  id: s.id,
  name: s.name,
  owner: s.owner,
  phone: s.phone,
  zone: s.zone,
  address: s.address,
  lat: s.lat,
  lng: s.lng,
  verified: s.verified,
  status: s.status,
  ivaPct: s.ivaPct,
  hours: s.hours,
  specialties: s.specialties,
  clauses: s.clauses,
});
