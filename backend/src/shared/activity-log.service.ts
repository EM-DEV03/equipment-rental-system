import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepo: Repository<ActivityLog>,
  ) {}

  async log(params: {
    action: string;
    entityName: string;
    entityId?: string;
    actorName?: string;
    metadata?: Record<string, unknown>;
  }) {
    const activity = this.activityLogRepo.create({
      action: params.action,
      entityName: params.entityName,
      entityId: params.entityId,
      actorName: params.actorName,
      metadata: params.metadata ?? null,
    });

    await this.activityLogRepo.save(activity);
  }
}
