import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, type FindOptionsWhere, In, IsNull, Not } from 'typeorm';
import type { PayType } from '../../common/enums.js';
import { normalizePhone } from '../../common/phone.js';
import { Car } from '../cars/car.entity.js';
import { CostItem } from '../cars/cost-item.entity.js';
import { helperPayCents, toPesos } from '../pricing/pricing.js';
import { User } from '../users/user.entity.js';
import { HelperPayment } from './helper-payment.entity.js';
import { Helper } from './helper.entity.js';

export interface PayInput {
  payType: PayType;
  payAmount?: number | null;
  payPct?: number | null;
}

export interface HelperInput extends PayInput {
  name: string;
  phone: string;
}

export interface HelperUpdate extends Partial<PayInput> {
  name?: string;
  /** false desactiva la cuenta: deja de poder entrar y de recibir coches. */
  active?: boolean;
}

/** Normaliza la regla de pago: solo se guarda el campo que corresponde al tipo. */
function payFields(pay: PayInput) {
  if (pay.payType === 'fijo') {
    if (pay.payAmount == null)
      throw new BadRequestException('payAmount es obligatorio con pago fijo');
    return { payType: pay.payType, payAmount: pay.payAmount, payPct: null };
  }
  if (pay.payPct == null)
    throw new BadRequestException(
      'payPct es obligatorio con pago por porcentaje',
    );
  return { payType: pay.payType, payAmount: null, payPct: pay.payPct };
}

/** Lunes 00:00 (hora del servidor) de la semana en curso. */
export function startOfWeek(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

@Injectable()
export class HelpersService {
  constructor(private readonly db: DataSource) {}

  list(shopId: string) {
    return this.db.getRepository(Helper).find({
      where: { shopId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(shopId: string, id: string) {
    const helper = await this.db.getRepository(Helper).findOne({
      where: { id, shopId },
      relations: { user: true },
    });
    if (!helper) throw new NotFoundException('Ayudante no encontrado');
    return helper;
  }

  /** El ayudante que corresponde a la sesión; 403 si la cuenta no tiene ficha de ayudante. */
  async forUser(userId: string) {
    const helper = await this.db.getRepository(Helper).findOneBy({ userId });
    if (!helper) throw new ForbiddenException('La cuenta no es de un ayudante');
    return helper;
  }

  /** Alta del ayudante y de su cuenta de acceso (entra con su teléfono). */
  async create(shopId: string, input: HelperInput) {
    const phone = normalizePhone(input.phone);
    const id = await this.db.transaction(async (tx) => {
      if (await tx.existsBy(User, { phone }))
        throw new ConflictException('Ese teléfono ya tiene una cuenta');
      const user = await tx.save(
        User,
        tx.create(User, {
          phone,
          name: input.name,
          role: 'ayudante',
          shopId,
        }),
      );
      const helper = await tx.save(
        Helper,
        tx.create(Helper, {
          shopId,
          userId: user.id,
          name: input.name,
          phone,
          ...payFields(input),
        }),
      );
      return helper.id;
    });
    return this.findOne(shopId, id);
  }

  async update(shopId: string, id: string, input: HelperUpdate) {
    const helper = await this.findOne(shopId, id);
    await this.db.transaction(async (tx) => {
      const changes: Partial<Helper> = {};
      if (input.name !== undefined) changes.name = input.name;
      if (input.payType !== undefined)
        Object.assign(changes, payFields(input as PayInput));
      if (Object.keys(changes).length)
        await tx.update(Helper, { id: helper.id }, changes);
      if (
        helper.userId &&
        (input.name !== undefined || input.active !== undefined)
      )
        await tx.update(
          User,
          { id: helper.userId },
          {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.active !== undefined ? { active: input.active } : {}),
          },
        );
    });
    return this.findOne(shopId, id);
  }

  payments(where: FindOptionsWhere<HelperPayment>) {
    return this.db.getRepository(HelperPayment).find({
      where,
      relations: { car: true, helper: true },
      order: { createdAt: 'DESC' },
    });
  }

  async markPaid(shopId: string, id: string) {
    const repo = this.db.getRepository(HelperPayment);
    const { affected } = await repo.update(
      { id, shopId, paidAt: IsNull() },
      { paidAt: new Date() },
    );
    if (!affected) {
      if (await repo.existsBy({ id, shopId }))
        throw new ConflictException('Ese pago ya estaba marcado como pagado');
      throw new NotFoundException('Pago no encontrado');
    }
    const [payment] = await this.payments({ id, shopId });
    return payment!;
  }

  /**
   * Lo que el ayudante lleva: pagos congelados (coches entregados) y lo estimado de los coches
   * que tiene en curso, calculado con su tarifa actual.
   */
  async summary(helper: Helper) {
    const [payments, open] = await Promise.all([
      this.payments({ helperId: helper.id, shopId: helper.shopId }),
      this.db.getRepository(Car).find({
        where: { helperId: helper.id, shopId: helper.shopId, state: Not(5) },
        order: { enteredAt: 'DESC' },
      }),
    ]);
    const costs = open.length
      ? await this.db
          .getRepository(CostItem)
          .findBy({ carId: In(open.map((c) => c.id)) })
      : [];
    const weekStart = startOfWeek();
    const sum = (xs: HelperPayment[]) =>
      toPesos(xs.reduce((acc, p) => acc + Math.round(p.amount * 100), 0));
    return {
      payments,
      inProgress: open.map((car) => ({
        car,
        estimated: toPesos(
          helperPayCents(
            costs.filter((c) => c.carId === car.id),
            helper,
          ),
        ),
      })),
      pendingTotal: sum(payments.filter((p) => !p.paidAt)),
      earnedThisWeek: sum(payments.filter((p) => p.createdAt >= weekStart)),
    };
  }
}
