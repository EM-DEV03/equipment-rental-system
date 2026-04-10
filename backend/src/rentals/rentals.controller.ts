import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RentalsService } from './rentals.service';

@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Get()
  list() {
    return this.rentalsService.list();
  }

  @Get('invoice/:invoiceNumber')
  findByInvoice(@Param('invoiceNumber') invoiceNumber: string) {
    return this.rentalsService.findByInvoice(invoiceNumber);
  }

  @Post()
  createRental(
    @Body()
    body: {
      customerId: string;
      userId: string;
      documentType?: 'FACTURA' | 'RECIBO';
      rentDate?: string;
      estimatedReturnDate: string;
      notes?: string;
      items: Array<{ equipmentId: string; quantity: number }>;
    },
  ) {
    return this.rentalsService.createRental(body);
  }
}
