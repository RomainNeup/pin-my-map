import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Test } from '@nestjs/testing';

// Disable throttling globally for e2e: APP_GUARD overrides via overrideGuard
// don't reliably take effect, so we monkey-patch the prototype before the
// AppModule is compiled. This affects test-time only.
(
  ThrottlerGuard.prototype as unknown as {
    canActivate: () => Promise<boolean>;
  }
).canActivate = async () => true;
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Server } from 'http';
import { AppModule } from '../../src/app.module';
import { JoseService } from '../../src/auth/jose.service';

export interface TestAppContext {
  app: INestApplication;
  mongo: MongoMemoryServer;
  httpServer: Server;
  jose: JoseService;
  connection: Connection;
  close: () => Promise<void>;
  clearDatabase: () => Promise<void>;
}

/**
 * Boots a full Nest AppModule against an in-memory MongoDB.
 * Throttler guard is overridden to a no-op so tests are not rate-limited.
 */
export async function createTestApp(): Promise<TestAppContext> {
  // Stable, dev-friendly defaults; tests must not hit external infra.
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
  delete process.env.GOOGLE_PLACES_API_KEY;
  delete process.env.MAPBOX_ACCESS_TOKEN;
  delete process.env.SMTP_HOST;
  delete process.env.GOOGLE_OAUTH_CLIENT_ID;
  delete process.env.APPLE_OAUTH_CLIENT_ID;

  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleRef.createNestApplication({ logger: false });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();

  const httpServer = app.getHttpServer() as Server;
  const jose = app.get(JoseService);
  const connection = app.get<Connection>(getConnectionToken());

  const clearDatabase = async (): Promise<void> => {
    if (!connection.db) return;
    const collections = await connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  };

  const close = async (): Promise<void> => {
    await app.close();
    await mongo.stop();
  };

  return { app, mongo, httpServer, jose, connection, close, clearDatabase };
}
