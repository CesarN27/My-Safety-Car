import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { numeric } from '../../common/numeric.transformer.js';
import { Car } from '../cars/car.entity.js';
import { Shop } from '../shops/shop.entity.js';
import { Helper } from './helper.entity.js';

/**
 * Lo que se le debe a un ayudante por un coche. El monto se congela al entregar el coche
 * (estado 5): mientras está abierto, el pago se calcula al vuelo con `pricing/`, y si después
 * cambia la tarifa del ayudante, lo ya entregado no se mueve. `paidAt` null = pendiente.
 */
@Entity('helper_payments')
@Index(['carId', 'helperId'], { unique: true })
@Index(['shopId', 'helperId', 'createdAt'])
@Check('"amount" >= 0')
export class HelperPayment {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') shopId: string;
  @ManyToOne(() => Shop, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'shopId' })
  shop?: Relation<Shop>;
  @Column('uuid') carId: string;
  @ManyToOne(() => Car, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'carId', referencedColumnName: 'id' },
    { name: 'shopId', referencedColumnName: 'shopId' },
  ])
  car?: Relation<Car>;
  @Column('uuid') helperId: string;
  // RESTRICT: no se borra un ayudante con historial de pagos.
  @ManyToOne(() => Helper, { onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: 'helperId', referencedColumnName: 'id' },
    { name: 'shopId', referencedColumnName: 'shopId' },
  ])
  helper?: Relation<Helper>;
  @Column('numeric', { precision: 12, scale: 2, transformer: numeric })
  amount: number;
  @Column({ type: 'timestamptz', nullable: true }) paidAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
