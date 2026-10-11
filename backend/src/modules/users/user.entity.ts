import {
  Column,
  CreateDateColumn,
  Check,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { ROLES, type Role } from '../../common/enums.js';
import { Shop } from '../shops/shop.entity.js';

/** Cuenta de acceso. El teléfono es la identidad (login por código). */
@Entity('users')
@Check(
  '("role" IN (\'taller\', \'ayudante\') AND "shopId" IS NOT NULL) OR ("role" IN (\'admin\', \'cliente\') AND "shopId" IS NULL)',
)
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index({ unique: true }) @Column() phone: string;
  @Column() name: string;
  @Column({ type: 'enum', enum: ROLES }) role: Role;
  /** Taller al que pertenece (taller y ayudante); null para admin y cliente. */
  @Column({ type: 'uuid', nullable: true }) shopId: string | null;
  @ManyToOne(() => Shop, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'shopId' })
  shop?: Relation<Shop | null>;
  @Column({ default: true }) active: boolean;
  @CreateDateColumn() createdAt: Date;
}
