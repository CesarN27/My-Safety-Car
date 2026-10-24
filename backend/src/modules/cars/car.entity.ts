import {
  Column,
  CreateDateColumn,
  Check,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import type { CarState, InspState } from '../../common/enums.js';
import { Client } from '../clients/client.entity.js';
import { Vehicle } from '../clients/vehicle.entity.js';
import { Helper } from '../helpers/helper.entity.js';
import { Shop } from '../shops/shop.entity.js';
import { CarLog } from './car-log.entity.js';
import { CostItem } from './cost-item.entity.js';

export interface Damage {
  id: number;
  x: number;
  y: number;
  note: string;
  /** Vista del dibujo del coche (PDF: arriba, frente, atrás, lado izq., lado der.). */
  view?: 'arriba' | 'frente' | 'atras' | 'izquierda' | 'derecha';
  type?: 'golpe' | 'rayon';
}

/** Expediente de un coche en un taller. */
@Entity('cars')
@Index(['shopId', 'folio'], { unique: true })
@Index(['shopId', 'state'])
// Destino de las claves compuestas (id, shopId) de archivos y pagos.
@Index(['id', 'shopId'], { unique: true })
@Check('"state" BETWEEN 0 AND 5')
@Check('"fuel" BETWEEN 0 AND 1')
export class Car {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column('uuid') shopId: string;
  @ManyToOne(() => Shop, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'shopId' })
  shop?: Relation<Shop>;
  /** Consecutivo legible; único dentro de cada taller. */
  @Column() folio: string;
  /** Token aleatorio del QR; se puede regenerar para revocar el anterior. */
  @Index({ unique: true }) @Column() qrToken: string;
  @CreateDateColumn() enteredAt: Date;
  /** Cuándo se entregó el coche (estado 5); null mientras siga en el taller. */
  @Column({ type: 'timestamptz', nullable: true }) deliveredAt: Date | null;
  @UpdateDateColumn() updatedAt: Date;

  @Index() @Column('uuid') vehicleId: string;
  @ManyToOne(() => Vehicle, { onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: 'vehicleId', referencedColumnName: 'id' },
    { name: 'shopId', referencedColumnName: 'shopId' },
  ])
  vehicle?: Relation<Vehicle>;
  /** Dueño al momento del servicio; se conserva aunque el vehículo cambie de dueño después. */
  @Index() @Column('uuid') clientId: string;
  @ManyToOne(() => Client, { onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: 'clientId', referencedColumnName: 'id' },
    { name: 'shopId', referencedColumnName: 'shopId' },
  ])
  client?: Relation<Client>;
  /** Kilometraje al ingreso. */
  @Column() km: string;

  @Column({ type: 'smallint', default: 0 }) state: CarState;
  @Column({ type: 'uuid', nullable: true }) helperId: string | null;
  // Compuesta con el taller: no se puede asignar un ayudante de otro taller. RESTRICT porque
  // SET NULL vaciaría también shopId; a un ayudante se le desactiva la cuenta, no se le borra.
  @ManyToOne(() => Helper, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: 'helperId', referencedColumnName: 'id' },
    { name: 'shopId', referencedColumnName: 'shopId' },
  ])
  helper?: Relation<Helper | null>;

  /** Descripción interna del servicio (dueño y ayudante). */
  @Column({ default: '' }) description: string;
  /** Versión para el cliente de la descripción (PDF: "versión para cliente"). */
  @Column({ default: '' }) clientDescription: string;
  /** Punto de inspección → 0 bien · 1 dañado · 2 no aplica. */
  @Column('jsonb', { default: () => "'{}'" }) inspection: Record<
    string,
    InspState
  >;
  /** Nivel de gasolina (0–1). */
  @Column('real', { default: 0 }) fuel: number;
  @Column('jsonb', { default: () => "'[]'" }) damages: Damage[];
  @Column({ default: true }) ivaOn: boolean;

  @OneToMany(() => CostItem, (c) => c.car) costs?: CostItem[];
  @OneToMany(() => CarLog, (l) => l.car) log?: CarLog[];
}
