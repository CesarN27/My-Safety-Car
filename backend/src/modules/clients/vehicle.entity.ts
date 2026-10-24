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
import { Client } from './client.entity.js';

/** Vehículo de un cliente en un taller; sus expedientes forman el historial de visitas. */
@Entity('vehicles')
@Index(['shopId', 'plates'])
@Index(['shopId', 'vin'])
@Index(['id', 'shopId'], { unique: true })
export class Vehicle {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') shopId: string;
  @ManyToOne(() => Shop, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'shopId' })
  shop?: Relation<Shop>;
  @Index() @Column('uuid') clientId: string;
  @ManyToOne(() => Client, { onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: 'clientId', referencedColumnName: 'id' },
    { name: 'shopId', referencedColumnName: 'shopId' },
  ])
  client?: Relation<Client>;
  @Column() brand: string;
  @Column() model: string;
  @Column() year: string;
  @Column() color: string;
  @Column({ default: '' }) plates: string;
  @Column({ default: '' }) vin: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
