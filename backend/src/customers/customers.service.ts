import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { Rental } from '../entities/rental.entity';
import { ActivityLogService } from '../shared/activity-log.service';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Rental)
    private readonly rentalRepo: Repository<Rental>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async list(search?: string) {
    if (!search) {
      return this.customerRepo.find({ order: { fullName: 'ASC' } });
    }

    return this.customerRepo.find({
      where: [
        { fullName: Like(`%${search}%`) },
        { documentId: Like(`%${search}%`) },
        { phone: Like(`%${search}%`) },
      ],
      order: { fullName: 'ASC' },
    });
  }

  async create(payload: {
    fullName: string;
    documentId: string;
    phone: string;
    address: string;
    notes?: string;
  }) {
    const existingCustomer = await this.customerRepo.findOne({
      where: { documentId: payload.documentId },
    });
    if (existingCustomer) {
      throw new BadRequestException('Ya existe un cliente con esa cédula o NIT');
    }

    const customer = this.customerRepo.create(payload);
    const savedCustomer = await this.customerRepo.save(customer);

    await this.activityLogService.log({
      action: 'CUSTOMER_CREATED',
      entityName: 'customers',
      entityId: savedCustomer.id,
      actorName: payload.fullName,
      metadata: { documentId: payload.documentId },
    });

    return savedCustomer;
  }

  async update(
    customerId: string,
    payload: Partial<{
      fullName: string;
      documentId: string;
      phone: string;
      address: string;
      notes: string;
    }>,
  ) {
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (payload.documentId && payload.documentId !== customer.documentId) {
      const duplicate = await this.customerRepo.findOne({
        where: { documentId: payload.documentId },
      });
      if (duplicate) {
        throw new BadRequestException('Ya existe un cliente con esa cédula o NIT');
      }
    }

    Object.assign(customer, payload);
    const savedCustomer = await this.customerRepo.save(customer);

    await this.activityLogService.log({
      action: 'CUSTOMER_UPDATED',
      entityName: 'customers',
      entityId: savedCustomer.id,
      actorName: savedCustomer.fullName,
    });

    return savedCustomer;
  }

  async getHistory(customerId: string) {
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const rentals = await this.rentalRepo.find({
      where: { customer: { id: customerId } },
      order: { createdAt: 'DESC' },
      relations: ['returns', 'returns.items'],
    });

    return {
      customer,
      rentals,
    };
  }
}
