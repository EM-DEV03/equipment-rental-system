import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  DAMAGE_CHARGE_RATE,
  LATE_PENALTY_RATE,
  MISSING_CHARGE_RATE,
} from '../common/business.constants';
import {
  differenceInRentalDays,
  normalizeDateOnly,
  roundMoney,
} from '../common/business.utils';
import { Equipment } from '../entities/equipment.entity';
import { Invoice } from '../entities/invoice.entity';
import { Rental } from '../entities/rental.entity';
import { ReturnCondition, ReturnEntity, ReturnItem } from '../entities/return.entity';
import { User } from '../entities/user.entity';
import { resolveEquipmentStatus } from '../equipment/equipment.service';
import { RentalsService } from '../rentals/rentals.service';
import { ActivityLogService } from '../shared/activity-log.service';

@Injectable()
export class ReturnsService {
  constructor(
    private readonly dataSource: DataSource,
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
    private readonly rentalsService: RentalsService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async previewReturn(invoiceNumber: string) {
    return this.rentalsService.findByInvoice(invoiceNumber);
  }

  async processReturn(payload: {
    invoiceNumber: string;
    userId: string;
    notes?: string;
    returnedItems: Array<{
      equipmentId: string;
      quantity: number;
      condition: ReturnCondition;
      notes?: string;
    }>;
  }) {
    const preview = await this.rentalsService.findByInvoice(payload.invoiceNumber);
    const outstandingMap = new Map(preview.outstandingItems.map((item) => [item.equipmentId, item]));
    const { savedReturn, rental, actorName, updatedPending } = await this.dataSource.transaction(
      async (manager) => {
      const invoice = await manager.findOne(Invoice, {
        where: { invoiceNumber: payload.invoiceNumber },
        relations: ['rental', 'rental.items', 'rental.items.equipment', 'rental.customer', 'rental.user'],
      });

      if (!invoice) {
        throw new NotFoundException('Factura no encontrada');
      }

      const user = await manager.findOne(User, { where: { id: payload.userId } });
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const rental = invoice.rental;
      const returnItems: ReturnItem[] = [];
      let latePenalty = 0;
      let damageCharges = 0;
      let missingCharges = 0;

      const returnDate = new Date();
      const returnCalendarDate = normalizeDateOnly(returnDate);
      const estimatedReturnDate = normalizeDateOnly(rental.estimatedReturnDate);
      const isLate = returnCalendarDate > estimatedReturnDate;
      const lateDays = isLate ? differenceInRentalDays(estimatedReturnDate, returnCalendarDate) : 0;

      for (const item of payload.returnedItems) {
        if (item.quantity <= 0) continue;

        const outstanding = outstandingMap.get(item.equipmentId);
        if (!outstanding) {
          throw new BadRequestException('Uno de los equipos no pertenece a la factura');
        }

        if (item.quantity > outstanding.quantityPending) {
          throw new BadRequestException(
            `La cantidad devuelta de ${outstanding.equipmentName} supera lo pendiente`,
          );
        }

        const equipment = await manager.findOne(Equipment, { where: { id: item.equipmentId } });
        if (!equipment) {
          throw new NotFoundException('Equipo no encontrado');
        }

        const additionalCharge = this.calculateConditionCharge(
          outstanding.unitPrice,
          item.quantity,
          item.condition,
        );

        if (lateDays > 0) {
          latePenalty += roundMoney(
            outstanding.unitPrice * item.quantity * lateDays * LATE_PENALTY_RATE,
          );
        }

        if (item.condition === 'DAMAGED') {
          damageCharges += additionalCharge;
          equipment.damagedQuantity += item.quantity;
          equipment.maintenanceQuantity += item.quantity;
        } else if (item.condition === 'INCOMPLETE') {
          missingCharges += additionalCharge;
          equipment.maintenanceQuantity += item.quantity;
        } else {
          equipment.availableQuantity += item.quantity;
        }

        equipment.status = resolveEquipmentStatus(equipment);
        await manager.save(Equipment, equipment);

        returnItems.push(
          Object.assign(new ReturnItem(), {
            equipment,
            quantityReturned: item.quantity,
            condition: item.condition,
            additionalCharge,
            notes: item.notes,
          }),
        );
      }

      if (!returnItems.length) {
        throw new BadRequestException('Debe registrar al menos un equipo devuelto');
      }

      const totalAdditionalCharges = roundMoney(latePenalty + damageCharges + missingCharges);

      const returnRecord = manager.create(ReturnEntity, {
        rental,
        invoice,
        user,
        returnDate,
        lateDays,
        latePenalty: roundMoney(latePenalty),
        damageCharges: roundMoney(damageCharges),
        missingCharges: roundMoney(missingCharges),
        totalAdditionalCharges,
        notes: payload.notes,
        items: returnItems,
      });

      const savedReturn = await manager.save(ReturnEntity, returnRecord);

      const updatedPending = preview.outstandingItems.map((item) => {
        const matched = payload.returnedItems.find((entry) => entry.equipmentId === item.equipmentId);
        return {
          ...item,
          quantityPending: item.quantityPending - (matched?.quantity ?? 0),
        };
      });

      const hasPendingItems = updatedPending.some((item) => item.quantityPending > 0);

      rental.status = hasPendingItems ? 'PARTIAL_RETURNED' : 'COMPLETED';
      rental.actualReturnDate = hasPendingItems ? null : returnDate;
      rental.latePenalty = roundMoney(Number(rental.latePenalty) + latePenalty);
      rental.damageCharges = roundMoney(
        Number(rental.damageCharges) + damageCharges + missingCharges,
      );
      rental.totalAmount = roundMoney(
        Number(rental.subtotal) + Number(rental.latePenalty) + Number(rental.damageCharges),
      );
      rental.balanceDue = roundMoney(Number(rental.totalAmount) - Number(rental.amountPaid));
      rental.paymentStatus =
        Number(rental.amountPaid) <= 0
          ? 'PENDING'
          : Number(rental.balanceDue) <= 0
            ? 'PAID'
            : 'PARTIAL';
      await manager.save(Rental, rental);

        return { savedReturn, rental, actorName: user.fullName, updatedPending };
      },
    );

    await this.activityLogService.log({
      action: 'RETURN_PROCESSED',
      entityName: 'returns',
      entityId: savedReturn.id,
      actorName,
      metadata: {
        invoiceNumber: payload.invoiceNumber,
        rentalNumber: rental.rentalNumber,
        status: rental.status,
      },
    });

    return {
      returnRecord: savedReturn,
      rental,
      outstandingItems: updatedPending,
    };
  }

  private calculateConditionCharge(
    unitPrice: number,
    quantity: number,
    condition: ReturnCondition,
  ) {
    if (condition === 'DAMAGED') {
      return roundMoney(unitPrice * quantity * DAMAGE_CHARGE_RATE);
    }

    if (condition === 'INCOMPLETE') {
      return roundMoney(unitPrice * quantity * MISSING_CHARGE_RATE);
    }

    return 0;
  }
}
