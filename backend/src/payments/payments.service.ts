import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { roundMoney } from '../common/business.utils';
import { Payment, PaymentMethod } from '../entities/payment.entity';
import { Rental } from '../entities/rental.entity';
import { User } from '../entities/user.entity';
import { ActivityLogService } from '../shared/activity-log.service';

function resolvePaymentStatus(totalAmount: number, amountPaid: number) {
  if (amountPaid <= 0) {
    return 'PENDING' as const;
  }

  if (amountPaid >= totalAmount) {
    return 'PAID' as const;
  }

  return 'PARTIAL' as const;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Rental)
    private readonly rentalRepo: Repository<Rental>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async list() {
    return this.paymentRepo.find({
      order: { paymentDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async create(payload: {
    rentalId: string;
    userId?: string;
    amount: number;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
    paymentDate?: string;
  }) {
    const { savedPayment, rental, user } = await this.dataSource.transaction(async (manager) => {
      const rental = await manager.findOne(Rental, { where: { id: payload.rentalId } });
      if (!rental) {
        throw new NotFoundException('Alquiler no encontrado');
      }

      if (payload.amount <= 0) {
        throw new BadRequestException('El valor del abono debe ser mayor a cero');
      }

      const currentBalance = Number(rental.balanceDue ?? rental.totalAmount);
      if (payload.amount > currentBalance) {
        throw new BadRequestException('El abono no puede superar el saldo pendiente');
      }

      let user: User | null = null;
      if (payload.userId) {
        user = await manager.findOne(User, { where: { id: payload.userId } });
        if (!user) {
          throw new NotFoundException('Usuario no encontrado');
        }
      }

      const payment = manager.create(Payment, {
        rental,
        user,
        amount: roundMoney(payload.amount),
        method: payload.method,
        reference: payload.reference || 'Abono registrado',
        notes: payload.notes,
        paymentDate: payload.paymentDate ? new Date(payload.paymentDate) : new Date(),
      });

      const savedPayment = await manager.save(Payment, payment);

      rental.amountPaid = roundMoney(Number(rental.amountPaid) + Number(savedPayment.amount));
      rental.balanceDue = roundMoney(Number(rental.totalAmount) - Number(rental.amountPaid));
      rental.paymentStatus = resolvePaymentStatus(
        Number(rental.totalAmount),
        Number(rental.amountPaid),
      );
      await manager.save(Rental, rental);

      return { savedPayment, rental, user };
    });

    await this.activityLogService.log({
      action: 'PAYMENT_CREATED',
      entityName: 'payments',
      entityId: savedPayment.id,
      actorName: user?.fullName,
      metadata: {
        rentalNumber: rental.rentalNumber,
        amount: savedPayment.amount,
        method: savedPayment.method,
      },
    });

    return savedPayment;
  }
}
