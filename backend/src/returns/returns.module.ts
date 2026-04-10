import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnsService } from './returns.service';
import { ReturnsController } from './returns.controller';
import { ReturnEntity, ReturnItem } from '../entities/return.entity';
import { Rental } from '../entities/rental.entity';
import { Invoice } from '../entities/invoice.entity';
import { Equipment } from '../entities/equipment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReturnEntity, ReturnItem, Rental, Invoice, Equipment])],
  controllers: [ReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}
