import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rental } from '../entities/rental.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Rental)
    private readonly rentalRepo: Repository<Rental>,
  ) {}

  async getActiveRentals() {
    return this.rentalRepo.find({
      where: [{ status: 'ACTIVE' }, { status: 'PARTIAL_RETURNED' }, { status: 'OVERDUE' }],
      order: { estimatedReturnDate: 'ASC' },
    });
  }

  async getTopEquipment() {
    const rentals = await this.rentalRepo.find({
      relations: ['items', 'items.equipment'],
    });

    const usageMap = new Map<
      string,
      { equipmentId: string; equipmentName: string; quantity: number }
    >();

    for (const rental of rentals) {
      for (const item of rental.items) {
        const key = item.equipment.id;
        const current = usageMap.get(key) ?? {
          equipmentId: key,
          equipmentName: item.equipment.name,
          quantity: 0,
        };
        current.quantity += item.quantity;
        usageMap.set(key, current);
      }
    }

    return Array.from(usageMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }

  async getIncome(from?: string, to?: string) {
    const rentals = await this.rentalRepo.find({ order: { rentDate: 'DESC' } });

    const filteredRentals = rentals.filter((rental) => {
      const rentDate = new Date(rental.rentDate);
      const isAfterFrom = from ? rentDate >= new Date(from) : true;
      const isBeforeTo = to ? rentDate <= new Date(to) : true;
      return isAfterFrom && isBeforeTo;
    });

    return {
      totalIncome: filteredRentals.reduce((sum, rental) => sum + Number(rental.totalAmount), 0),
      totalRentals: filteredRentals.length,
      items: filteredRentals.map((rental) => ({
        rentalNumber: rental.rentalNumber,
        customer: rental.customer.fullName,
        amount: Number(rental.totalAmount),
        rentDate: rental.rentDate,
        status: rental.status,
      })),
    };
  }

  async getReceivables() {
    const rentals = await this.rentalRepo.find({
      where: [{ paymentStatus: 'PENDING' }, { paymentStatus: 'PARTIAL' }],
      order: { createdAt: 'DESC' },
    });

    return rentals.map((rental) => ({
      rentalId: rental.id,
      rentalNumber: rental.rentalNumber,
      customer: rental.customer.fullName,
      totalAmount: Number(rental.totalAmount),
      amountPaid: Number(rental.amountPaid),
      balanceDue: Number(rental.balanceDue),
      paymentStatus: rental.paymentStatus,
      estimatedReturnDate: rental.estimatedReturnDate,
      status: rental.status,
    }));
  }
}
