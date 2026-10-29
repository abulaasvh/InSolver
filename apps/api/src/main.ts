import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger docs at /api/docs
  const config = new DocumentBuilder()
    .setTitle('InSolver API')
    .setDescription(
      'AICTE Institution-Centric Complaint Case Monitoring & Coordination Tool — SIH 2026 Problem SIH26264. **All data is synthetic demo data.**',
    )
    .setVersion('1.0.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('cases', 'Case management — register, route, update, audit')
    .addTag('institutions', 'Institution profiles and case timelines')
    .addTag('overlaps', 'Cross-cell overlap detection and review workflow')
    .addTag('bureaus', 'Active Bureaus and Cells')
    .addTag('reports', 'Dashboard statistics and CSV exports')
    .addTag('audit', 'Append-only audit trail')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
    },
  });

  // Health endpoint
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'insolver-api', synthetic: true, ts: new Date().toISOString() });
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`\n🚀 InSolver API running at http://localhost:${port}/api`);
  console.log(`📖 Swagger docs at  http://localhost:${port}/api/docs`);
  console.log(`🏥 Health check at  http://localhost:${port}/health`);
  console.log(`🔒 All data is SYNTHETIC demo data — SIH 2026 Prototype\n`);
}

bootstrap();
