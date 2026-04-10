import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RentalItem } from './rental.entity';
import { ReturnItem } from './return.entity';

export type EquipmentStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'MAINTENANCE';

@Entity('equipment')
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column()
  type: string;

  @Column('int')
  totalQuantity: number;

  @Column('int')
  availableQuantity: number;

  @Column('int', { default: 0 })
  maintenanceQuantity: number;

  @Column('int', { default: 0 })
  damagedQuantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  dailyRate: number;

  @Column({ default: 'AVAILABLE' })
  status: EquipmentStatus;

  @Column({ nullable: true })
  location: string;

  @OneToMany(() => RentalItem, (item) => item.equipment)
  rentalItems: RentalItem[];

  @OneToMany(() => ReturnItem, (item) => item.equipment)
  returnItems: ReturnItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
