import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Equipment } from './equipment.entity';
import { Invoice } from './invoice.entity';
import { Rental } from './rental.entity';
import { User } from './user.entity';

export type ReturnCondition = 'GOOD' | 'DAMAGED' | 'INCOMPLETE';

@Entity('returns')
export class ReturnEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Rental, (rental) => rental.returns, { eager: true })
  rental: Rental;

  @ManyToOne(() => Invoice, { eager: true })
  invoice: Invoice;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @CreateDateColumn()
  returnDate: Date;

  @Column('int', { default: 0 })
  lateDays: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  latePenalty: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  damageCharges: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  missingCharges: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalAdditionalCharges: number;

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => ReturnItem, (item) => item.returnEntity, { cascade: true, eager: true })
  items: ReturnItem[];
}

@Entity('return_items')
export class ReturnItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ReturnEntity, (returnEntity) => returnEntity.items)
  returnEntity: ReturnEntity;

  @ManyToOne(() => Equipment, (equipment) => equipment.returnItems, { eager: true })
  equipment: Equipment;

  @Column('int')
  quantityReturned: number;

  @Column({ default: 'GOOD' })
  condition: ReturnCondition;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  additionalCharge: number;

  @Column({ nullable: true })
  notes: string;
}
