import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Equipment } from './equipment.entity';
import { Payment } from './payment.entity';
import { User } from './user.entity';
import { ReturnEntity } from './return.entity';

export type RentalStatus = 'ACTIVE' | 'PARTIAL_RETURNED' | 'COMPLETED' | 'OVERDUE';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';

@Entity('rentals')
export class Rental {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  rentalNumber: string;

  @ManyToOne(() => Customer, (customer) => customer.rentals, { eager: true })
  customer: Customer;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column('datetime')
  rentDate: Date;

  @Column('date')
  estimatedReturnDate: Date;

  @Column('datetime', { nullable: true })
  actualReturnDate: Date | null;

  @Column({ default: 'ACTIVE' })
  status: RentalStatus;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  latePenalty: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  damageCharges: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  balanceDue: number;

  @Column({ default: 'PENDING' })
  paymentStatus: PaymentStatus;

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => RentalItem, (item) => item.rental, { cascade: true, eager: true })
  items: RentalItem[];

  @OneToMany(() => ReturnEntity, (returnEntity) => returnEntity.rental)
  returns: ReturnEntity[];

  @OneToMany(() => Payment, (payment) => payment.rental)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('rental_items')
export class RentalItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Rental, (rental) => rental.items)
  rental: Rental;

  @ManyToOne(() => Equipment, (equipment) => equipment.rentalItems, { eager: true })
  equipment: Equipment;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('int')
  estimatedDays: number;

  @Column('decimal', { precision: 10, scale: 2 })
  lineTotal: number;
}
