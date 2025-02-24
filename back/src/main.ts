import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function main() {
  const app = await NestFactory
    .create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Pin My Map API')
    .setDescription('The Pin My Map API description')
    .addBearerAuth({ bearerFormat: 'JWT', type: 'http' })
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  app.enableCors({ origin: 'http://localhost:5173' })

  await app
    .listen(8080);
}

main();
