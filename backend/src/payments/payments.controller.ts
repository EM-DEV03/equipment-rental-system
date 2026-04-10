import { Body, Controller, Get, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  list() {
    return this.paymentsService.list();
  }

  @Post()
  create(
    @Body()
    body: {
      rentalId: string;
      userId?: string;
      amount: number;
      method: 'CASH' | 'TRANSFER' | 'CARD' | 'MIXED';
      reference?: string;
      notes?: string;
      paymentDate?: string;
    },
  ) {
    return this.paymentsService.create(body);
  }
}
