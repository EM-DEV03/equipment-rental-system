import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { BusinessSettings } from '../entities/business-settings.entity';
import { Customer } from '../entities/customer.entity';
import { DocumentSequence } from '../entities/document-sequence.entity';
import { Equipment } from '../entities/equipment.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
    @InjectRepository(BusinessSettings)
    private readonly settingsRepo: Repository<BusinessSettings>,
    @InjectRepository(DocumentSequence)
    private readonly sequenceRepo: Repository<DocumentSequence>,
  ) {}

  async onModuleInit() {
    await this.seedUsers();
    await this.seedCustomers();
    await this.seedEquipment();
    await this.seedSettings();
    await this.seedSequences();
  }

  private async seedUsers() {
    if ((await this.userRepo.count()) > 0) {
      return;
    }

    const passwordHash = await bcrypt.hash('Admin123*', 10);
    const employeeHash = await bcrypt.hash('Empleado123*', 10);

    await this.userRepo.save([
      this.userRepo.create({
        fullName: 'Maria Iriarte',
        username: 'admin',
        passwordHash,
        role: 'ADMIN',
      }),
      this.userRepo.create({
        fullName: 'Operador de Patio',
        username: 'empleado',
        passwordHash: employeeHash,
        role: 'EMPLOYEE',
      }),
    ]);
  }

  private async seedCustomers() {
    if ((await this.customerRepo.count()) > 0) {
      return;
    }

    await this.customerRepo.save([
      this.customerRepo.create({
        fullName: 'Constructora Alfa SAS',
        documentId: '900123456',
        phone: '3201234567',
        address: 'Cra 15 # 98-20, Bogota',
        notes: 'Cliente frecuente',
      }),
      this.customerRepo.create({
        fullName: 'Juan Carlos Perez',
        documentId: '1020304050',
        phone: '3105557788',
        address: 'Calle 45 # 12-30, Tunja',
      }),
    ]);
  }

  private async seedEquipment() {
    if ((await this.equipmentRepo.count()) > 0) {
      return;
    }

    await this.equipmentRepo.save([
      this.equipmentRepo.create({
        name: 'Mezcladora de concreto 1 bulto',
        type: 'Maquinaria',
        totalQuantity: 6,
        availableQuantity: 6,
        dailyRate: 95000,
        status: 'AVAILABLE',
        location: 'Patio principal',
      }),
      this.equipmentRepo.create({
        name: 'Andamio tubular estandar',
        type: 'Andamios',
        totalQuantity: 40,
        availableQuantity: 40,
        dailyRate: 12000,
        status: 'AVAILABLE',
        location: 'Bodega A',
      }),
      this.equipmentRepo.create({
        name: 'Martillo demoledor 15 kg',
        type: 'Herramienta',
        totalQuantity: 8,
        availableQuantity: 8,
        dailyRate: 55000,
        status: 'AVAILABLE',
        location: 'Bodega B',
      }),
      this.equipmentRepo.create({
        name: 'Cortadora de concreto',
        type: 'Herramienta',
        totalQuantity: 3,
        availableQuantity: 2,
        maintenanceQuantity: 1,
        dailyRate: 78000,
        status: 'LOW_STOCK',
        location: 'Taller',
      }),
    ]);
  }

  private async seedSettings() {
    if ((await this.settingsRepo.count()) > 0) {
      return;
    }

    await this.settingsRepo.save(
      this.settingsRepo.create({
        businessName: 'Arley Rental',
        taxId: '900123456',
        address: 'Bogota, Colombia',
        phone: '3201234567',
        email: 'alquileres@arleyrental.local',
        invoiceFooter: 'Gracias por confiar en nuestro servicio de alquiler.',
        defaultPrinterProfile: 'standard',
      }),
    );
  }

  private async seedSequences() {
    const sequenceNames = ['rental', 'invoice_factura', 'invoice_recibo'];

    for (const name of sequenceNames) {
      const existing = await this.sequenceRepo.findOne({ where: { name } });
      if (!existing) {
        await this.sequenceRepo.save(
          this.sequenceRepo.create({
            name,
            currentValue: 0,
          }),
        );
      }
    }
  }
}
