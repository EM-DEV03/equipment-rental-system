import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ReturnsService } from './returns.service';

@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get('invoice/:invoiceNumber')
  previewReturn(@Param('invoiceNumber') invoiceNumber: string) {
    return this.returnsService.previewReturn(invoiceNumber);
  }

  @Post()
  processReturn(
    @Body()
    body: {
      invoiceNumber: string;
      userId: string;
      notes?: string;
      returnedItems: Array<{
        equipmentId: string;
        quantity: number;
        condition: 'GOOD' | 'DAMAGED' | 'INCOMPLETE';
        notes?: string;
      }>;
    },
  ) {
    return this.returnsService.processReturn(body);
  }
}
