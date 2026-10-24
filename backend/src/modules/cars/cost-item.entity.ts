import {
  Column,
  Check,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { COST_KINDS, type CostKind } from '../../common/enums.js';
import { numeric } from '../../common/numeric.transformer.js';
import { Car } from './car.entity.js';

/** Concepto de costo. Solo lo ven taller y admin; el cliente recibe únicamente el total. */
@Entity('cost_items')
@Check('"cost" >= 0')
@Check('"price" >= 0')
@Check('"qty" > 0')
export class CostItem {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column('uuid') carId: string;
  @ManyToOne(() => Car, (c) => c.costs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carId' })
  car?: Relation<Car>;
  @Column({ type: 'enum', enum: COST_KINDS }) kind: CostKind;
  @Column() desc: string;
  /** Cantidad (litros, piezas, horas…); cost y price son por unidad. */
  @Column('numeric', {
    precision: 10,
    scale: 2,
    default: 1,
    transformer: numeric,
  })
  qty: number;
  /** Orden en que el taller capturó los conceptos. */
  @Column({ type: 'smallint', default: 0 }) position: number;
  /** Lo que le cuesta al taller por unidad (refacciones y gastos). */
  @Column('numeric', {
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numeric,
  })
  cost: number;
  /** Lo que se le cobra al cliente por unidad (refacciones y mano de obra). */
  @Column('numeric', {
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numeric,
  })
  price: number;
  @Column({ type: 'varchar', nullable: true }) supplier: string | null;
}
