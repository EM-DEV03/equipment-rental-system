import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Rental } from './rental.entity';

export type InvoiceDocumentType = 'RECIBO' | 'FACTURA';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column({ default: 'FACTURA' })
  documentType: InvoiceDocumentType;

  @OneToOne(() => Rental, { eager: true })
  @JoinColumn()
  rental: Rental;

  @CreateDateColumn()
  issueDate: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ nullable: true })
  pdfUrl: string;
}
