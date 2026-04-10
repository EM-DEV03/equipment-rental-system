import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EquipmentService } from './equipment.service';

@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  list(@Query('search') search?: string) {
    return this.equipmentService.list(search);
  }

  @Post()
  create(
    @Body()
    body: {
      name: string;
      type: string;
      totalQuantity: number;
      dailyRate: number;
      location?: string;
    },
  ) {
    return this.equipmentService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, string | number>) {
    return this.equipmentService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.equipmentService.delete(id);
  }
}
