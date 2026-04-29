import * as request from 'supertest';
import { createTestApp, TestAppContext } from './utils/app-factory';

describe('Smoke (e2e)', () => {
  let ctx: TestAppContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('returns 401 when accessing a private endpoint without a token', async () => {
    const res = await request(ctx.httpServer).get('/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.requestId).toBeDefined();
  });

  it('returns 404 (with requestId) for an unknown route', async () => {
    const res = await request(ctx.httpServer).get('/no-such-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.requestId).toBeDefined();
  });
});
