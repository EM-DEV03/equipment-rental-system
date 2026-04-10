import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Equipment } from '../entities/equipment.entity';
import { Rental } from '../entities/rental.entity';
import { ReturnEntity } from '../entities/return.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
    @InjectRepository(Rental)
    private readonly rentalRepo: Repository<Rental>,
    @InjectRepository(ReturnEntity)
    private readonly returnRepo: Repository<ReturnEntity>,
  ) {}

  async getSummary() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const equipment = await this.equipmentRepo.find();
    const activeRentals = await this.rentalRepo.count({
      where: [{ status: 'ACTIVE' }, { status: 'PARTIAL_RETURNED' }, { status: 'OVERDUE' }],
    });
    const returnsToday = await this.returnRepo.count({
      where: { returnDate: Between(startOfDay, endOfDay) },
    });
    const rentalsDueToday = await this.rentalRepo.count({
      where: { estimatedReturnDate: Between(startOfDay, endOfDay) },
    });
    const rentals = await this.rentalRepo.find();
    const pendingBalance = rentals.reduce((sum, rental) => sum + Number(rental.balanceDue), 0);

    const totalAvailable = equipment.reduce((sum, item) => sum + item.availableQuantity, 0);
    const totalRented = equipment.reduce(
      (sum, item) => sum + (item.totalQuantity - item.availableQuantity - item.maintenanceQuantity),
      0,
    );

    const recentRentals = await this.rentalRepo.find({
      take: 5,
      order: { createdAt: 'DESC' },
    });

    return {
      metrics: {
        totalAvailable,
        totalRented,
        activeRentals,
        returnsToday,
        rentalsDueToday,
        pendingBalance,
      },
      recentRentals,
    };
  }
}
