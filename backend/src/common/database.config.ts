import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export function getDatabaseConfig(): TypeOrmModuleOptions {
  const databaseType = (process.env.DB_TYPE ?? 'sqlite').toLowerCase();

  if (databaseType === 'postgres') {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl:
        process.env.DB_SSL === 'true'
          ? {
              rejectUnauthorized: false,
            }
          : false,
      autoLoadEntities: true,
      synchronize: process.env.DB_SYNCHRONIZE !== 'false',
      extra: {
        max: Number(process.env.DB_POOL_MAX ?? 10),
      },
    };
  }

  return {
    type: 'sqlite',
    database: join(process.cwd(), 'rental_database.sqlite'),
    autoLoadEntities: true,
    synchronize: true,
  };
}
