import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type DefaultPrinterProfile = 'pos' | 'standard';

@Entity('business_settings')
export class BusinessSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'RentalOps' })
  businessName: string;

  @Column({ default: '900123456' })
  taxId: string;

  @Column({ default: 'Bogota, Colombia' })
  address: string;

  @Column({ default: '3201234567' })
  phone: string;

  @Column({ default: 'alquileres@arleyrental.local' })
  email: string;

  @Column({ default: 'Factura y recibo validos como soporte de entrega y devolucion.' })
  invoiceFooter: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0.2 })
  latePenaltyRate: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0.5 })
  damageChargeRate: number;

  @Column('decimal', { precision: 10, scale: 2, default: 1.5 })
  missingChargeRate: number;

  @Column({ default: 'standard' })
  defaultPrinterProfile: DefaultPrinterProfile;

  @Column({ default: 'COP' })
  currencyCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
