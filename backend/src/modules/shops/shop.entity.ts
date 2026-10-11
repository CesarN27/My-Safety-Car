import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SHOP_STATUSES, type ShopStatus } from '../../common/enums.js';

@Entity('shops')
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
  @CreateDateColumn() createdAt: Date;
}
