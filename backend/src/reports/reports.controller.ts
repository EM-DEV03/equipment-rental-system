import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('active-rentals')
  getActiveRentals() {
    return this.reportsService.getActiveRentals();
  }

  @Get('top-equipment')
  getTopEquipment() {
    return this.reportsService.getTopEquipment();
  }

  @Get('income')
  getIncome(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getIncome(from, to);
  }

  @Get('receivables')
  getReceivables() {
    return this.reportsService.getReceivables();
  }
}
