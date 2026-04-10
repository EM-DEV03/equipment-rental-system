import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rental } from './rental.entity';
import { User } from './user.entity';

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD' | 'MIXED';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Rental, (rental) => rental.payments, { eager: true })
  rental: Rental;

  @ManyToOne(() => User, { eager: true, nullable: true })
  user: User | null;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'CASH' })
  method: PaymentMethod;

  @Column({ default: 'Abono registrado' })
  reference: string;

  @Column({ nullable: true })
  notes: string;

  @Column('timestamp')
  paymentDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
