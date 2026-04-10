import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from '../auth/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  async health() {
    const databaseType = this.dataSource.options.type;
    const databaseConnected = this.dataSource.isInitialized;

    return {
      status: databaseConnected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: {
        type: databaseType,
        connected: databaseConnected,
      },
      app: 'Arley Rental API',
    };
  }
}
