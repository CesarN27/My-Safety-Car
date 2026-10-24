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
import { Shop } from '../shops/shop.entity.js';
import { User } from '../users/user.entity.js';

/**
 * Dueño de un coche, tal como lo capturó un taller. Es por taller a propósito: nombre, teléfono y
 * domicilio solo los ve el dueño del taller que los capturó y la propia cuenta del cliente.
 * El historial entre talleres se arma desde `userId`, nunca cruzando clientes de talleres distintos.
 */
@Entity('clients')
@Index(['shopId', 'phone'], { unique: true })
// Permite que vehículos y expedientes referencien (id, shopId) y así nunca crucen talleres.
@Index(['id', 'shopId'], { unique: true })
export class Client {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') shopId: string;
  @ManyToOne(() => Shop, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'shopId' })
  shop?: Relation<Shop>;
  @Column() name: string;
  @Column() phone: string;
  @Column({ default: '' }) address: string;
  /** Cuenta de la app del cliente; se llena cuando verifica su teléfono al escanear el QR. */
  @Index() @Column({ type: 'uuid', nullable: true }) userId: string | null;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: Relation<User | null>;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
