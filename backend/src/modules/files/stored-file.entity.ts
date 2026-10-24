import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { FILE_KINDS, type FileKind } from '../../common/enums.js';
import { CarLog } from '../cars/car-log.entity.js';
import { Car } from '../cars/car.entity.js';
import { Helper } from '../helpers/helper.entity.js';
import { Shop } from '../shops/shop.entity.js';
import { User } from '../users/user.entity.js';

/**
 * Metadatos de una foto subida. El contenido vive en el almacenamiento
 * (interfaz `Storage`) bajo `key`; nunca se sirve como estático público.
 * Todo archivo pertenece a un taller, y las referencias a coche, bitácora y ayudante
 * son compuestas con `shopId`/`carId`, así que la base impide mezclar talleres.
 */
@Entity('files')
@Index(['shopId', 'kind'])
@Check(
  `("kind" IN ('entrada', 'pieza_danada', 'pieza_nueva') AND "carId" IS NOT NULL AND "carLogId" IS NULL AND "helperId" IS NULL)
  OR ("kind" = 'avance' AND "carId" IS NOT NULL AND "carLogId" IS NOT NULL AND "helperId" IS NULL)
  OR ("kind" = 'ayudante' AND "helperId" IS NOT NULL AND "carId" IS NULL AND "carLogId" IS NULL)
  OR ("kind" = 'taller' AND "carId" IS NULL AND "carLogId" IS NULL AND "helperId" IS NULL)`,
)
@Check('"size" >= 0')
export class StoredFile {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') shopId: string;
  @ManyToOne(() => Shop, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'shopId' })
  shop?: Relation<Shop>;
  @Column({ type: 'enum', enum: FILE_KINDS }) kind: FileKind;

  @Index() @Column({ type: 'uuid', nullable: true }) carId: string | null;
  @ManyToOne(() => Car, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'carId', referencedColumnName: 'id' },
    { name: 'shopId', referencedColumnName: 'shopId' },
  ])
  car?: Relation<Car | null>;
  @Index() @Column({ type: 'uuid', nullable: true }) carLogId: string | null;
  @ManyToOne(() => CarLog, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'carLogId', referencedColumnName: 'id' },
    { name: 'carId', referencedColumnName: 'carId' },
  ])
  carLog?: Relation<CarLog | null>;
  @Index() @Column({ type: 'uuid', nullable: true }) helperId: string | null;
  @ManyToOne(() => Helper, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'helperId', referencedColumnName: 'id' },
    { name: 'shopId', referencedColumnName: 'shopId' },
  ])
  helper?: Relation<Helper | null>;

  /** Clave en el almacenamiento; la genera el servidor, nunca viene del cliente. */
  @Index({ unique: true }) @Column() key: string;
  @Column() mimeType: string;
  @Column('bigint', {
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  size: number;
  /** El cliente solo ve las fotos del coche que el taller marque; la del ayudante nunca. */
  @Column({ default: false }) visibleToClient: boolean;
  @Column({ type: 'uuid', nullable: true }) uploadedById: string | null;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy?: Relation<User | null>;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
