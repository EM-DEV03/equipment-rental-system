import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  buildSequence,
  differenceInRentalDays,
  normalizeDateOnly,
  roundMoney,
} from '../common/business.utils';
import { Customer } from '../entities/customer.entity';
import { Equipment } from '../entities/equipment.entity';
import { Invoice, InvoiceDocumentType } from '../entities/invoice.entity';
import { DocumentSequence } from '../entities/document-sequence.entity';
import { Rental, RentalItem } from '../entities/rental.entity';
import { ReturnEntity } from '../entities/return.entity';
import { User } from '../entities/user.entity';
import { resolveEquipmentStatus } from '../equipment/equipment.service';
import { PdfGeneratorService } from '../pdf/pdf-generator.service';
import { ActivityLogService } from '../shared/activity-log.service';

@Injectable()
export class RentalsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(DocumentSequence)
    private readonly sequenceRepo: Repository<DocumentSequence>,
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Rental)
    private readonly rentalRepo: Repository<Rental>,
    @InjectRepository(ReturnEntity)
    private readonly returnRepo: Repository<ReturnEntity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async list() {
    return this.rentalRepo.find({
      order: { createdAt: 'DESC' },
      relations: ['returns', 'returns.items'],
    });
  }

  async createRental(payload: {
    customerId: string;
    userId: string;
    documentType?: InvoiceDocumentType;
    rentDate?: string;
    estimatedReturnDate: string;
    notes?: string;
    items: Array<{ equipmentId: string; quantity: number }>;
  }) {
    if (!payload.items?.length) {
      throw new BadRequestException('Debe seleccionar al menos un equipo');
    }

    const documentType = payload.documentType ?? 'FACTURA';
    const rentDate = payload.rentDate ? normalizeDateOnly(payload.rentDate) : new Date();
    const estimatedReturnDate = normalizeDateOnly(payload.estimatedReturnDate);
    const estimatedDays = differenceInRentalDays(rentDate, estimatedReturnDate);

    const { savedInvoice, savedRental, customer, user, rentalNumber, invoiceNumber } =
      await this.dataSource.transaction(async (manager) => {
        const customer = await manager.findOne(Customer, {
          where: { id: payload.customerId },
        });
        if (!customer) {
          throw new NotFoundException('Cliente no encontrado');
        }

        const user = await manager.findOne(User, { where: { id: payload.userId } });
        if (!user) {
          throw new NotFoundException('Usuario no encontrado');
        }

        const rentalNumber = await this.nextSequence(manager, 'rental', 'ALQ');
        const invoiceNumber = await this.nextSequence(
          manager,
          documentType === 'FACTURA' ? 'invoice_factura' : 'invoice_recibo',
          documentType === 'FACTURA' ? 'FAC' : 'REC',
        );

        const rentalItems: RentalItem[] = [];
        let subtotal = 0;

        for (const item of payload.items) {
          const equipment = await manager.findOne(Equipment, {
            where: { id: item.equipmentId },
          });
          if (!equipment) {
            throw new NotFoundException(`Equipo no encontrado: ${item.equipmentId}`);
          }

          if (item.quantity <= 0) {
            throw new BadRequestException(
              `La cantidad para ${equipment.name} debe ser mayor a cero`,
            );
          }

          if (equipment.availableQuantity < item.quantity) {
            throw new ConflictException(`No hay stock suficiente para ${equipment.name}`);
          }

          const unitPrice = Number(equipment.dailyRate);
          const lineTotal = roundMoney(unitPrice * item.quantity * estimatedDays);
          subtotal += lineTotal;

          equipment.availableQuantity -= item.quantity;
          equipment.status = resolveEquipmentStatus(equipment);
          await manager.save(Equipment, equipment);

          rentalItems.push(
            Object.assign(new RentalItem(), {
              equipment,
              quantity: item.quantity,
              unitPrice,
              estimatedDays,
              lineTotal,
            }),
          );
        }

        const rental = manager.create(Rental, {
          rentalNumber,
          customer,
          user,
          rentDate,
          estimatedReturnDate,
          actualReturnDate: null,
          status: 'ACTIVE',
          subtotal: roundMoney(subtotal),
          latePenalty: 0,
          damageCharges: 0,
          totalAmount: roundMoney(subtotal),
          amountPaid: 0,
          balanceDue: roundMoney(subtotal),
          paymentStatus: 'PENDING',
          notes: payload.notes,
          items: rentalItems,
        });

        const savedRental = await manager.save(Rental, rental);

        const invoice = manager.create(Invoice, {
          invoiceNumber,
          documentType,
          rental: savedRental,
          totalAmount: savedRental.totalAmount,
        });

        const savedInvoice = await manager.save(Invoice, invoice);

        return {
          savedInvoice,
          savedRental,
          customer,
          user,
          rentalNumber,
          invoiceNumber,
        };
      });

    savedInvoice.pdfUrl = await this.pdfGeneratorService.generateInvoicePdf(savedInvoice, savedRental);
    await this.invoiceRepo.save(savedInvoice);

    await this.activityLogService.log({
      action: 'RENTAL_CREATED',
      entityName: 'rentals',
      entityId: savedRental.id,
      actorName: user.fullName,
      metadata: {
        rentalNumber,
        invoiceNumber,
        customer: customer.fullName,
      },
    });

    return {
      rental: savedRental,
      invoice: savedInvoice,
    };
  }

  async findByInvoice(invoiceNumber: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { invoiceNumber },
      relations: ['rental', 'rental.customer', 'rental.user', 'rental.items', 'rental.items.equipment'],
    });

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    const returns = await this.returnRepo.find({
      where: { rental: { id: invoice.rental.id } },
      relations: ['items', 'items.equipment'],
      order: { returnDate: 'ASC' },
    });

    const returnedQuantities = new Map<string, number>();
    for (const returnRecord of returns) {
      for (const item of returnRecord.items) {
        const current = returnedQuantities.get(item.equipment.id) ?? 0;
        returnedQuantities.set(item.equipment.id, current + item.quantityReturned);
      }
    }

    return {
      invoice,
      rental: invoice.rental,
      returns,
      outstandingItems: invoice.rental.items.map((item) => ({
        equipmentId: item.equipment.id,
        equipmentName: item.equipment.name,
        quantityRented: item.quantity,
        quantityReturned: returnedQuantities.get(item.equipment.id) ?? 0,
        quantityPending: item.quantity - (returnedQuantities.get(item.equipment.id) ?? 0),
        unitPrice: Number(item.unitPrice),
      })),
    };
  }

  private async nextSequence(
    manager: EntityManager,
    name: string,
    prefix: string,
  ) {
    let sequence = await manager.findOne(DocumentSequence, {
      where: { name },
    });

    if (!sequence) {
      sequence = manager.create(DocumentSequence, {
        name,
        currentValue: 0,
      });
    }

    sequence.currentValue += 1;
    const savedSequence = await manager.save(DocumentSequence, sequence);
    return buildSequence(prefix, savedSequence.currentValue);
  }
}
