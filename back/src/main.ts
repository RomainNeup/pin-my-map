import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function main() {
  // Load environment variables
  dotenv.config();

  const logger = new Logger('Bootstrap');

  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production');
    }
    logger.warn('JWT_SECRET is not set; falling back to development default');
  }

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Only enable Swagger in development environment
  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Pin My Map API')
      .setDescription('The Pin My Map API description')
      .addBearerAuth({ bearerFormat: 'JWT', type: 'http' })
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api', app, document);
  }

  // Parse CORS allowed origins from environment variable
  const corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173'];

  app.enableCors({
    origin: corsAllowedOrigins,
    credentials: true,
  });

  const port = Number(process.env.PORT) || 8080;
  await app.listen(port);
}

main();
