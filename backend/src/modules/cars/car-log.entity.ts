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
import type { CarState } from '../../common/enums.js';
import { User } from '../users/user.entity.js';
import { Car } from './car.entity.js';

/** Bitácora de avance: cada cambio de estado con nota y fotos. */
@Entity('car_logs')
export class CarLog {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column('uuid') carId: string;
  @ManyToOne(() => Car, (c) => c.log, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carId' })
  car?: Relation<Car>;
  @Column({ type: 'smallint' }) state: CarState;
  @Column({ type: 'uuid', nullable: true }) authorId: string | null;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'authorId' })
  author?: Relation<User | null>;
  /** Nombre al momento del registro, para que el historial no cambie si se renombra. */
  @Column() authorName: string;
  @Column({ type: 'text', nullable: true }) note: string | null;
  @Column('text', { array: true, default: () => "'{}'" }) photos: string[];
  @Column({ default: true }) visibleToClient: boolean;
  @CreateDateColumn() at: Date;
}
