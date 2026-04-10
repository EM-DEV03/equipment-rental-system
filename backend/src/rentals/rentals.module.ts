import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalsService } from './rentals.service';
import { RentalsController } from './rentals.controller';
import { Rental, RentalItem } from '../entities/rental.entity';
import { Equipment } from '../entities/equipment.entity';
import { Invoice } from '../entities/invoice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rental, RentalItem, Equipment, Invoice])],
  controllers: [RentalsController],
  providers: [RentalsService],
})
export class RentalsModule {}
