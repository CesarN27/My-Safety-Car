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
import type { CarState } from '../../common/enums.js';
import { User } from '../users/user.entity.js';
import { Car } from './car.entity.js';

/** Bitácora de avance: cada cambio de estado con nota; sus fotos van en `files` (kind avance). */
@Entity('car_logs')
@Index(['carId', 'at'])
// Destino de la clave compuesta (carLogId, carId) de los archivos de avance.
@Index(['id', 'carId'], { unique: true })
@Check('"state" BETWEEN 0 AND 5')
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
  @Column({ default: true }) visibleToClient: boolean;
  @CreateDateColumn() at: Date;
}
