import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Equipment, EquipmentStatus } from '../entities/equipment.entity';
import { ActivityLogService } from '../shared/activity-log.service';

export function resolveEquipmentStatus(equipment: Equipment): EquipmentStatus {
  if (equipment.maintenanceQuantity > 0 && equipment.availableQuantity === 0) {
    return 'MAINTENANCE';
  }

  if (equipment.availableQuantity <= 0) {
    return 'OUT_OF_STOCK';
  }

  if (equipment.availableQuantity <= Math.max(1, Math.floor(equipment.totalQuantity * 0.2))) {
    return 'LOW_STOCK';
  }

  return 'AVAILABLE';
}

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async list(search?: string) {
    if (!search) {
      return this.equipmentRepo.find({ order: { name: 'ASC' } });
    }

    return this.equipmentRepo.find({
      where: [{ name: Like(`%${search}%`) }, { type: Like(`%${search}%`) }],
      order: { name: 'ASC' },
    });
  }

  async create(payload: {
    name: string;
    type: string;
    totalQuantity: number;
    dailyRate: number;
    location?: string;
  }) {
    if (payload.totalQuantity <= 0) {
      throw new BadRequestException('La cantidad total debe ser mayor a cero');
    }

    const equipment = this.equipmentRepo.create({
      ...payload,
      availableQuantity: payload.totalQuantity,
      maintenanceQuantity: 0,
      damagedQuantity: 0,
      status: 'AVAILABLE',
    });

    equipment.status = resolveEquipmentStatus(equipment);
    const savedEquipment = await this.equipmentRepo.save(equipment);

    await this.activityLogService.log({
      action: 'EQUIPMENT_CREATED',
      entityName: 'equipment',
      entityId: savedEquipment.id,
      actorName: savedEquipment.name,
    });

    return savedEquipment;
  }

  async update(
    equipmentId: string,
    payload: Partial<{
      name: string;
      type: string;
      totalQuantity: number;
      availableQuantity: number;
      maintenanceQuantity: number;
      damagedQuantity: number;
      dailyRate: number;
      location: string;
    }>,
  ) {
    const equipment = await this.equipmentRepo.findOne({ where: { id: equipmentId } });
    if (!equipment) {
      throw new NotFoundException('Equipo no encontrado');
    }

    Object.assign(equipment, payload);

    if (equipment.availableQuantity < 0 || equipment.totalQuantity <= 0) {
      throw new BadRequestException('Los valores de inventario no son válidos');
    }

    equipment.status = resolveEquipmentStatus(equipment);
    const savedEquipment = await this.equipmentRepo.save(equipment);

    await this.activityLogService.log({
      action: 'EQUIPMENT_UPDATED',
      entityName: 'equipment',
      entityId: savedEquipment.id,
      actorName: savedEquipment.name,
    });

    return savedEquipment;
  }
}
