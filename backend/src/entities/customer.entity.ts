import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rental } from './rental.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  documentId: string;

  @Column()
  fullName: string;

  @Column()
  phone: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => Rental, (rental) => rental.customer)
  rentals: Rental[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
