import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { DEFAULT_BACKEND_PORT } from './common/business.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? DEFAULT_BACKEND_PORT);
  const host = process.env.HOST ?? '0.0.0.0';
  const corsOrigin = process.env.CORS_ORIGIN?.split(',').map((item) => item.trim()) ?? true;

  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(json({ limit: '2mb' }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.use('/pdfs', require('express').static(join(process.cwd(), 'public', 'pdfs')));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Arley Rental API')
    .setDescription('API del MVP para alquiler de equipos de construccion')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port, host);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
