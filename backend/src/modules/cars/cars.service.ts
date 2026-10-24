import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import {
  And,
  DataSource,
  type EntityManager,
  type FindOptionsWhere,
  In,
  LessThan,
  MoreThanOrEqual,
} from 'typeorm';
import type { AuthUser } from '../../auth/auth-user.js';
import type { CarState, CostKind, InspState } from '../../common/enums.js';
import {
  type ClientInput,
  ClientsService,
} from '../clients/clients.service.js';
import { Vehicle } from '../clients/vehicle.entity.js';
import { StoredFile } from '../files/stored-file.entity.js';
import { HelperPayment } from '../helpers/helper-payment.entity.js';
import { Helper } from '../helpers/helper.entity.js';
import { computeTotals, type Totals } from '../pricing/pricing.js';
import { Shop } from '../shops/shop.entity.js';
import { CarLog } from './car-log.entity.js';
import {
  checkTransition,
  STATE_NAMES,
  type TransitionError,
} from './car-state.js';
import { Car, type Damage, type Signature } from './car.entity.js';
import { CostItem } from './cost-item.entity.js';

export interface VehicleInput {
  brand: string;
  model: string;
  year: string;
  color: string;
  plates?: string;
  vin?: string;
}

export interface CarFields {
  km?: string;
  fuel?: number;
  inspection?: Record<string, InspState>;
  damages?: Damage[];
  description?: string;
  clientDescription?: string;
  ivaOn?: boolean;
  helperId?: string | null;
}

export interface CreateCarInput extends CarFields {
  client: ClientInput;
  /** Vehículo ya registrado en el taller (visita de regreso)… */
  vehicleId?: string;
  /** …o uno nuevo. */
  vehicle?: VehicleInput;
  km: string;
}

export interface CostInput {
  kind: CostKind;
  desc: string;
  qty: number;
  cost: number;
  price: number;
  supplier?: string | null;
}

export interface LogInput {
  note?: string;
  visibleToClient?: boolean;
}

/** Expediente con todo lo necesario para armar cualquier vista y calcular el dinero. */
export interface CarBundle {
  car: Car;
  costs: CostItem[];
  log: CarLog[];
  /** Fotos del expediente (metadatos); cada vista decide cuáles mostrar. */
  files: StoredFile[];
  totals: Totals;
}

const TRANSITION_MESSAGES: Record<TransitionError, string> = {
  misma_etapa: 'El coche ya está en esa etapa',
  transicion_invalida: 'Ese cambio de etapa no está permitido',
  rol_no_permitido: 'Tu cuenta no puede llevar el coche a esa etapa',
  sin_total: 'Captura los costos antes de marcarlo como listo',
};

const DELIVERED = 5;
const newQrToken = () => randomBytes(24).toString('base64url');

/**
 * Lógica de los expedientes, común a todas las superficies de la API. Cada método recibe el
 * filtro de acceso ya armado por quien lo llama (taller, ayudante o cliente), así que aquí
 * nunca se busca un coche solo por id.
 */
@Injectable()
export class CarsService {
  constructor(
    private readonly db: DataSource,
    private readonly clients: ClientsService,
  ) {}

  /** Coches que cumplen el filtro de acceso, con vehículo, cliente y ayudante. */
  find(where: FindOptionsWhere<Car> | FindOptionsWhere<Car>[]) {
    return this.db.getRepository(Car).find({
      where,
      relations: { vehicle: true, client: true, helper: true, shop: true },
      order: { enteredAt: 'DESC' },
    });
  }

  /** Expediente completo; 404 si no existe o el filtro de acceso no lo alcanza. */
  async bundle(where: FindOptionsWhere<Car>): Promise<CarBundle> {
    const car = await this.db.getRepository(Car).findOne({
      where,
      relations: { vehicle: true, client: true, helper: true, shop: true },
    });
    if (!car) throw new NotFoundException('Expediente no encontrado');
    return this.withMoney(this.db.manager, car);
  }

  /** Igual que `find`, con el total de cada coche (para listas y tablero). */
  async findWithTotals(where: FindOptionsWhere<Car> | FindOptionsWhere<Car>[]) {
    const cars = await this.find(where);
    if (!cars.length) return [];
    const ids = cars.map((c) => c.id);
    const [costs, payments] = await Promise.all([
      this.db.getRepository(CostItem).findBy({ carId: In(ids) }),
      this.db.getRepository(HelperPayment).findBy({ carId: In(ids) }),
    ]);
    return cars.map((car) => ({
      car,
      totals: this.totalsOf(
        car,
        costs.filter((c) => c.carId === car.id),
        payments.filter((p) => p.carId === car.id),
      ),
    }));
  }

  async create(user: AuthUser, shopId: string, input: CreateCarInput) {
    if (!input.vehicleId === !input.vehicle)
      throw new BadRequestException(
        'Indica vehicleId o vehicle, uno de los dos',
      );

    const id = await this.db.transaction(async (tx) => {
      const client = await this.clients.findOrCreate(tx, shopId, input.client);

      let vehicle: Vehicle;
      if (input.vehicleId) {
        const found = await tx.findOneBy(Vehicle, {
          id: input.vehicleId,
          shopId,
        });
        if (!found) throw new BadRequestException('Vehículo no encontrado');
        // Si el coche cambió de dueño, el vehículo pasa al cliente capturado ahora.
        if (found.clientId !== client.id) {
          found.clientId = client.id;
          await tx.save(Vehicle, found);
        }
        vehicle = found;
      } else {
        vehicle = await tx.save(
          Vehicle,
          tx.create(Vehicle, {
            shopId,
            clientId: client.id,
            ...input.vehicle!,
            plates: input.vehicle!.plates?.trim().toUpperCase() ?? '',
            vin: input.vehicle!.vin?.trim().toUpperCase() ?? '',
          }),
        );
      }
      if (input.helperId) await this.assertHelper(tx, shopId, input.helperId);

      const car = await tx.save(
        Car,
        tx.create(Car, {
          shopId,
          folio: await this.nextFolio(tx, shopId),
          qrToken: newQrToken(),
          vehicleId: vehicle.id,
          clientId: client.id,
          km: input.km,
          fuel: input.fuel ?? 0,
          inspection: input.inspection ?? {},
          damages: input.damages ?? [],
          description: input.description ?? '',
          clientDescription: input.clientDescription ?? '',
          ivaOn: input.ivaOn ?? true,
          helperId: input.helperId ?? null,
          state: 0,
        }),
      );
      await tx.save(
        CarLog,
        tx.create(CarLog, {
          carId: car.id,
          fromState: null,
          state: 0,
          authorId: user.id,
          authorName: user.name,
          note: null,
          visibleToClient: true,
        }),
      );
      return car.id;
    });
    return this.bundle({ id, shopId });
  }

  async update(shopId: string, id: string, fields: CarFields) {
    await this.db.transaction(async (tx) => {
      const car = await this.lockOpen(tx, { id, shopId });
      if (fields.helperId) await this.assertHelper(tx, shopId, fields.helperId);
      const { helperId, ...rest } = fields;
      await tx.update(
        Car,
        { id: car.id },
        {
          ...rest,
          ...(helperId !== undefined ? { helperId } : {}),
        },
      );
    });
    return this.bundle({ id, shopId });
  }

  /** Reemplaza todos los conceptos de costo (así guarda el frontend la pantalla de costos). */
  async replaceCosts(
    shopId: string,
    id: string,
    items: CostInput[],
    ivaOn?: boolean,
  ) {
    await this.db.transaction(async (tx) => {
      const car = await this.lockOpen(tx, { id, shopId });
      // En Listo el cliente ya ve el total: cambiar costos lo cambiaría sin avisar.
      if (car.state === 4)
        throw new ConflictException(
          'El coche está listo para entrega: regrésalo a reparación para cambiar costos',
        );
      await tx.delete(CostItem, { carId: car.id });
      await tx.save(
        CostItem,
        items.map((item, position) =>
          tx.create(CostItem, {
            carId: car.id,
            kind: item.kind,
            desc: item.desc,
            qty: item.qty,
            cost: item.cost,
            price: item.price,
            supplier: item.supplier ?? null,
            position,
          }),
        ),
      );
      if (ivaOn !== undefined) await tx.update(Car, { id: car.id }, { ivaOn });
    });
    return this.bundle({ id, shopId });
  }

  /**
   * Cambia la etapa y deja constancia en la bitácora. Al entregar (5) congela el pago del ayudante.
   * `where` es el filtro de acceso: el taller pasa su shopId; el ayudante, además, su helperId.
   */
  async changeState(
    user: AuthUser,
    where: FindOptionsWhere<Car>,
    to: CarState,
    log: LogInput,
  ) {
    const id = await this.db.transaction(async (tx) => {
      const car = await tx.findOne(Car, {
        where,
        lock: { mode: 'pessimistic_write' },
      });
      if (!car) throw new NotFoundException('Expediente no encontrado');
      const { totals } = await this.withMoney(tx, car);

      const error = checkTransition({
        from: car.state,
        to,
        role: user.role,
        hasTotal: totals.total > 0,
      });
      if (error === 'rol_no_permitido')
        throw new ForbiddenException(TRANSITION_MESSAGES[error]);
      if (error)
        throw new ConflictException(
          error === 'transicion_invalida'
            ? `No se puede pasar de ${STATE_NAMES[car.state]} a ${STATE_NAMES[to]}`
            : TRANSITION_MESSAGES[error],
        );

      if (to === DELIVERED && car.helperId)
        await tx.save(
          HelperPayment,
          tx.create(HelperPayment, {
            shopId: car.shopId,
            carId: car.id,
            helperId: car.helperId,
            amount: totals.helperPay,
            paidAt: null,
          }),
        );
      await tx.update(
        Car,
        { id: car.id },
        { state: to, ...(to === DELIVERED ? { deliveredAt: new Date() } : {}) },
      );
      await this.writeLog(tx, user, car.id, car.state, to, log);
      return car.id;
    });
    return this.bundle({ ...where, id } as FindOptionsWhere<Car>);
  }

  /** Nota de avance sin cambiar la etapa. */
  async addNote(user: AuthUser, where: FindOptionsWhere<Car>, log: LogInput) {
    const id = await this.db.transaction(async (tx) => {
      const car = await this.lockOpen(tx, where);
      await this.writeLog(tx, user, car.id, null, car.state, log);
      return car.id;
    });
    return this.bundle({ ...where, id } as FindOptionsWhere<Car>);
  }

  /**
   * Firma de recepción. Guarda también las cláusulas vigentes del taller en ese momento: es lo
   * que el cliente aceptó, aunque el taller las cambie después. Se puede volver a firmar solo
   * mientras el coche sigue en Recibido.
   */
  async sign(shopId: string, id: string, signature: Signature) {
    await this.db.transaction(async (tx) => {
      const car = await this.lockOpen(tx, { id, shopId });
      if (car.signature && car.state !== 0)
        throw new ConflictException(
          'El expediente ya está firmado; solo se puede volver a firmar en Recibido',
        );
      const shop = await tx.findOneByOrFail(Shop, { id: shopId });
      await tx.update(
        Car,
        { id: car.id },
        { signature, signedAt: new Date(), signedClauses: shop.clauses },
      );
    });
    return this.bundle({ id, shopId });
  }

  /** Nuevo token de QR: el anterior deja de funcionar al instante. */
  async rotateQr(shopId: string, id: string) {
    await this.db.transaction(async (tx) => {
      const car = await this.lockOpen(tx, { id, shopId });
      await tx.update(Car, { id: car.id }, { qrToken: newQrToken() });
    });
    return this.bundle({ id, shopId });
  }

  /** Coches entregados en [from, to), con su dinero; base de los reportes. */
  deliveredBetween(shopId: string, from: Date, to: Date) {
    return this.findWithTotals({
      shopId,
      state: DELIVERED,
      deliveredAt: And(MoreThanOrEqual(from), LessThan(to)),
    });
  }

  private async withMoney(tx: EntityManager, car: Car): Promise<CarBundle> {
    const [costs, log, payments, files] = await Promise.all([
      tx.find(CostItem, {
        where: { carId: car.id },
        order: { position: 'ASC' },
      }),
      tx.find(CarLog, { where: { carId: car.id }, order: { at: 'ASC' } }),
      tx.findBy(HelperPayment, { carId: car.id }),
      tx.find(StoredFile, {
        where: { carId: car.id },
        order: { createdAt: 'ASC' },
      }),
    ]);
    car.shop ??= (await tx.findOneByOrFail(Shop, { id: car.shopId })) as Shop;
    if (car.helperId && car.helper === undefined)
      car.helper = await tx.findOneBy(Helper, { id: car.helperId });
    return {
      car,
      costs,
      log,
      files,
      totals: this.totalsOf(car, costs, payments),
    };
  }

  private totalsOf(car: Car, costs: CostItem[], payments: HelperPayment[]) {
    const frozen = payments.find((p) => p.helperId === car.helperId);
    return computeTotals(costs, {
      ivaOn: car.ivaOn,
      ivaPct: car.shop?.ivaPct,
      helper: car.helper ?? null,
      frozenHelperPay: frozen?.amount ?? null,
    });
  }

  /** Bloquea el expediente para escribir; los entregados ya no se modifican. */
  private async lockOpen(tx: EntityManager, where: FindOptionsWhere<Car>) {
    const car = await tx.findOne(Car, {
      where,
      lock: { mode: 'pessimistic_write' },
    });
    if (!car) throw new NotFoundException('Expediente no encontrado');
    if (car.state === DELIVERED)
      throw new ConflictException('El expediente ya se entregó');
    return car;
  }

  private async assertHelper(tx: EntityManager, shopId: string, id: string) {
    const helper = await tx.findOne(Helper, {
      where: { id, shopId },
      relations: { user: true },
    });
    if (!helper || helper.user?.active === false)
      throw new BadRequestException('Ayudante no encontrado');
  }

  /** Consecutivo por taller, tomado e incrementado en una sola sentencia (sin carreras). */
  private async nextFolio(tx: EntityManager, shopId: string) {
    const { raw } = await tx
      .createQueryBuilder()
      .update(Shop)
      .set({ nextFolio: () => '"nextFolio" + 1' })
      .where('id = :shopId', { shopId })
      .returning('"nextFolio"')
      .execute();
    const taken = Number((raw as { nextFolio: number }[])[0]!.nextFolio) - 1;
    return String(taken).padStart(4, '0');
  }

  private writeLog(
    tx: EntityManager,
    user: AuthUser,
    carId: string,
    fromState: CarState | null,
    state: CarState,
    log: LogInput,
  ) {
    return tx.save(
      CarLog,
      tx.create(CarLog, {
        carId,
        fromState,
        state,
        authorId: user.id,
        authorName: user.name,
        note: log.note?.trim() || null,
        visibleToClient: log.visibleToClient ?? true,
      }),
    );
  }
}
