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
import { Car } from './car.entity.js';

/** Fotos de recepción del coche (las del avance van en car_logs.photos). */
@Entity('car_photos')
export class CarPhoto {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column('uuid') carId: string;
  @ManyToOne(() => Car, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carId' })
  car?: Relation<Car>;
  @Column() path: string;
  @CreateDateColumn() createdAt: Date;
}
