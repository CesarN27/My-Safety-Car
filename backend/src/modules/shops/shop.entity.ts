import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { numeric } from '../../common/numeric.transformer.js';
import { SHOP_STATUSES, type ShopStatus } from '../../common/enums.js';

@Entity('shops')
@Check('"ivaPct" BETWEEN 0 AND 100')
@Check('"nextFolio" > 0')
export class Shop {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  @Column() owner: string;
  @Column() phone: string;
  @Column() zone: string;
  @Column() address: string;
  @Column('text', { array: true, default: () => "'{}'" }) specialties: string[];
  @Column({ type: 'enum', enum: SHOP_STATUSES, default: 'invitado' })
  status: ShopStatus;
  @Column({ default: false }) verified: boolean;
  @Column() hours: string;
  @Column('double precision') lat: number;
  @Column('double precision') lng: number;
  /** Siguiente folio de expediente; se toma y se incrementa en la misma sentencia. */
  @Column({ type: 'int', default: 1 }) nextFolio: number;
  /** Tasa de IVA del taller, en porcentaje (16 general, 8 en la frontera). */
  @Column('numeric', {
    precision: 5,
    scale: 2,
    default: 16,
    transformer: numeric,
  })
  ivaPct: number;
  @CreateDateColumn() createdAt: Date;
}
