import * as request from 'supertest';
import type { Server } from 'http';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { INestApplication } from '@nestjs/common';
import { JoseService } from '../../src/auth/jose.service';
import { User } from '../../src/user/user.entity';

export interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'user' | 'admin';
  token: string;
}

let counter = 0;
function uniq(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export async function registerAndLogin(
  app: INestApplication,
  overrides: Partial<{ email: string; password: string; name: string }> = {},
): Promise<RegisteredUser> {
  const httpServer = app.getHttpServer() as Server;
  const email = overrides.email ?? `${uniq('u')}@test.local`;
  const password = overrides.password ?? 'password123';
  const name = overrides.name ?? `User ${counter}`;

  const regRes = await request(httpServer)
    .post('/auth/register')
    .send({ email, password, name });
  if (regRes.status !== 201 && regRes.status !== 200) {
    throw new Error(
      `register failed: ${regRes.status} ${JSON.stringify(regRes.body)}`,
    );
  }

  const loginRes = await request(httpServer)
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  const token = loginRes.body.accessToken as string;
  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const created = await userModel.findOne({ email }).lean().exec();
  if (!created) throw new Error('user not found after register');

  return {
    id: (created._id as { toString(): string }).toString(),
    email,
    name,
    password,
    role: created.role,
    token,
  };
}

export async function makeAdmin(
  app: INestApplication,
): Promise<RegisteredUser> {
  const user = await registerAndLogin(app);
  const userModel = app.get<Model<User>>(getModelToken(User.name));
  await userModel.updateOne({ _id: user.id }, { $set: { role: 'admin' } });
  const jose = app.get(JoseService);
  const token = await jose.signAsync({
    name: user.name,
    email: user.email,
    id: user.id,
    role: 'admin',
  });
  return { ...user, role: 'admin', token };
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
