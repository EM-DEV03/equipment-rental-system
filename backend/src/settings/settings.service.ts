import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessSettings } from '../entities/business-settings.entity';
import { ActivityLogService } from '../shared/activity-log.service';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(BusinessSettings)
    private readonly settingsRepo: Repository<BusinessSettings>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async getSettings() {
    let settings = await this.settingsRepo.findOne({ where: {} });
    if (!settings) {
      settings = await this.settingsRepo.save(
        this.settingsRepo.create({
          businessName: 'Arley Rental',
        }),
      );
    }

    return settings;
  }

  async updateSettings(payload: Partial<BusinessSettings>) {
    const settings = await this.getSettings();
    Object.assign(settings, payload);
    const savedSettings = await this.settingsRepo.save(settings);

    await this.activityLogService.log({
      action: 'SETTINGS_UPDATED',
      entityName: 'business_settings',
      entityId: savedSettings.id,
      actorName: savedSettings.businessName,
    });

    return savedSettings;
  }
}
