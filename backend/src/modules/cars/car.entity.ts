import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import type { CarState, InspState } from '../../common/enums.js';
import { Helper } from '../helpers/helper.entity.js';
import { Shop } from '../shops/shop.entity.js';
import { User } from '../users/user.entity.js';
import { CarLog } from './car-log.entity.js';
import { CostItem } from './cost-item.entity.js';

export interface Damage {
  id: number;
  x: number;
  y: number;
  note: string;
}

/** Expediente de un coche en un taller. */
@Entity('cars')
export class Car {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column('uuid') shopId: string;
  @ManyToOne(() => Shop, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'shopId' })
  shop?: Relation<Shop>;
  @Index({ unique: true }) @Column() folio: string;
  /** Token aleatorio del QR; se puede regenerar para revocar el anterior. */
  @Index({ unique: true }) @Column() qrToken: string;
  @CreateDateColumn() enteredAt: Date;

  @Column() brand: string;
  @Column() model: string;
  @Column() year: string;
  @Column() color: string;
  @Column() plates: string;
  @Column() vin: string;
  @Column() km: string;

  @Column() clientName: string;
  @Column() clientPhone: string;
  @Column() clientAddress: string;
  /** Cuenta del cliente, se llena cuando escanea el QR. */
  @Index() @Column({ type: 'uuid', nullable: true }) clientUserId:
    string | null;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clientUserId' })
  clientUser?: Relation<User | null>;

  @Column({ type: 'smallint', default: 0 }) state: CarState;
  @Column({ type: 'uuid', nullable: true }) helperId: string | null;
  @ManyToOne(() => Helper, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'helperId' })
  helper?: Relation<Helper | null>;

  @Column({ default: '' }) description: string;
  /** Punto de inspección → 0 bien · 1 dañado · 2 no aplica. */
  @Column('jsonb', { default: () => "'{}'" }) inspection: Record<
    string,
    InspState
  >;
  /** Nivel de gasolina (0–1). */
  @Column('real', { default: 0 }) fuel: number;
  @Column('jsonb', { default: () => "'[]'" }) damages: Damage[];
  /** Ruta de la firma del cliente en el almacenamiento; null si no ha firmado. */
  @Column({ type: 'varchar', nullable: true }) signaturePath: string | null;
  @Column({ default: false }) ivaOn: boolean;

  @OneToMany(() => CostItem, (c) => c.car) costs?: CostItem[];
  @OneToMany(() => CarLog, (l) => l.car) log?: CarLog[];
}
