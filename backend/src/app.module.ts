import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { getDatabaseConfig } from './common/database.config';
import { CustomersController } from './customers/customers.controller';
import { CustomersService } from './customers/customers.service';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { EquipmentController } from './equipment/equipment.controller';
import { EquipmentService } from './equipment/equipment.service';
import { ActivityLog } from './entities/activity-log.entity';
import { BusinessSettings } from './entities/business-settings.entity';
import { Customer } from './entities/customer.entity';
import { DocumentSequence } from './entities/document-sequence.entity';
import { Equipment } from './entities/equipment.entity';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { Rental, RentalItem } from './entities/rental.entity';
import { ReturnEntity, ReturnItem } from './entities/return.entity';
import { User } from './entities/user.entity';
import { HealthController } from './health/health.controller';
import { PaymentsController } from './payments/payments.controller';
import { PaymentsService } from './payments/payments.service';
import { PdfGeneratorService } from './pdf/pdf-generator.service';
import { RentalsController } from './rentals/rentals.controller';
import { RentalsService } from './rentals/rentals.service';
import { ReportsController } from './reports/reports.controller';
import { ReportsService } from './reports/reports.service';
import { ReturnsController } from './returns/returns.controller';
import { ReturnsService } from './returns/returns.service';
import { SettingsController } from './settings/settings.controller';
import { SettingsService } from './settings/settings.service';
import { ActivityLogService } from './shared/activity-log.service';
import { SeedService } from './shared/seed.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(getDatabaseConfig()),
    TypeOrmModule.forFeature([
      ActivityLog,
      BusinessSettings,
      Customer,
      DocumentSequence,
      Equipment,
      Invoice,
      Payment,
      Rental,
      RentalItem,
      ReturnEntity,
      ReturnItem,
      User,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'equipapp-dev-secret',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [
    AuthController,
    CustomersController,
    DashboardController,
    EquipmentController,
    HealthController,
    PaymentsController,
    RentalsController,
    ReportsController,
    ReturnsController,
    SettingsController,
  ],
  providers: [
    ActivityLogService,
    AuthService,
    CustomersService,
    DashboardService,
    EquipmentService,
    PaymentsService,
    PdfGeneratorService,
    RentalsService,
    ReportsService,
    ReturnsService,
    SettingsService,
    SeedService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
