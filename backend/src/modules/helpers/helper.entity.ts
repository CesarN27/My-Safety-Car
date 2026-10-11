import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { PAY_TYPES, type PayType } from '../../common/enums.js';
import { numeric } from '../../common/numeric.transformer.js';
import { Shop } from '../shops/shop.entity.js';
import { User } from '../users/user.entity.js';

@Entity('helpers')
export class Helper {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column('uuid') shopId: string;
  @ManyToOne(() => Shop, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shopId' })
  shop?: Relation<Shop>;
  /** Cuenta con la que entra el ayudante a la app. */
  @Column({ type: 'uuid', nullable: true }) userId: string | null;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: Relation<User | null>;
  @Column() name: string;
  @Column() phone: string;
  @Column({ type: 'varchar', nullable: true }) photo: string | null;
  @Column({ type: 'enum', enum: PAY_TYPES }) payType: PayType;
  /** Monto fijo (payType = fijo). */
  @Column('numeric', {
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numeric,
  })
  payAmount: number | null;
  /** Porcentaje de la mano de obra (payType = porcentaje). */
  @Column('numeric', {
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: numeric,
  })
  payPct: number | null;
  @Column({ default: false }) paid: boolean;
  @CreateDateColumn() createdAt: Date;
}
