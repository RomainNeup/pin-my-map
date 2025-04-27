import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function main() {
  // Load environment variables
  dotenv.config();
  
  const app = await NestFactory
    .create(AppModule);
    
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
    credentials: true 
  });

  await app
    .listen(8080);
}

main();
