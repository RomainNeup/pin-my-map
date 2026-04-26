import * as request from 'supertest';
import type { Server } from 'http';
import { INestApplication } from '@nestjs/common';
import { authHeader, RegisteredUser } from './auth-helpers';

export interface CreatedPlace {
  id: string;
  name: string;
}

/**
 * Creates a place via HTTP. Use an admin token so the place is auto-approved
 * and visible to all users (otherwise it stays in `pending` and only the
 * creator/admins can read it).
 */
export async function createPlace(
  app: INestApplication,
  admin: RegisteredUser,
  overrides: Partial<{
    name: string;
    address: string;
    description: string;
    image: string;
    location: { lat: number; lng: number };
  }> = {},
): Promise<CreatedPlace> {
  const httpServer = app.getHttpServer() as Server;
  const name = overrides.name ?? `Place ${Date.now()}-${Math.random()}`;
  const body = {
    name,
    address: overrides.address ?? '1 Test Street, Testville',
    description:
      overrides.description ?? 'A lovely place used for automated tests.',
    image: overrides.image ?? 'https://example.com/img.png',
    location: overrides.location ?? { lat: 48.8566, lng: 2.3522 },
  };
  const res = await request(httpServer)
    .post('/place')
    .set(authHeader(admin.token))
    .send(body)
    .expect(201);
  return { id: res.body.id as string, name };
}

export async function savePlace(
  app: INestApplication,
  user: RegisteredUser,
  placeId: string,
): Promise<string> {
  const httpServer = app.getHttpServer() as Server;
  await request(httpServer)
    .post(`/saved/${placeId}`)
    .set(authHeader(user.token))
    .expect(201);
  const exists = await request(httpServer)
    .get(`/saved/${placeId}/exists`)
    .set(authHeader(user.token))
    .expect(200);
  return exists.body.id as string;
}

export async function createTag(
  app: INestApplication,
  user: RegisteredUser,
  overrides: Partial<{ name: string; emoji: string; color: string }> = {},
): Promise<{ id: string; name: string }> {
  const httpServer = app.getHttpServer() as Server;
  const name = overrides.name ?? `tag-${Date.now()}-${Math.random()}`;
  const res = await request(httpServer)
    .post('/tag')
    .set(authHeader(user.token))
    .send({ name, emoji: overrides.emoji ?? '🍕', color: overrides.color })
    .expect(201);
  return { id: res.body.id as string, name };
}
