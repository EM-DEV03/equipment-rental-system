import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  list(@Query('search') search?: string) {
    return this.customersService.list(search);
  }

  @Post()
  create(
    @Body()
    body: {
      fullName: string;
      documentId: string;
      phone: string;
      address: string;
      notes?: string;
    },
  ) {
    return this.customersService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, string>) {
    return this.customersService.update(id, body);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.customersService.getHistory(id);
  }
}
