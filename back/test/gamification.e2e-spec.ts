import * as request from 'supertest';
import { createTestApp, TestAppContext } from './utils/app-factory';
import { authHeader, makeAdmin, registerAndLogin } from './utils/auth-helpers';
import { createPlace, savePlace } from './utils/fixtures';

describe('Gamification (e2e)', () => {
  let ctx: TestAppContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.close();
  });
  beforeEach(async () => {
    await ctx.clearDatabase();
  });

  it('awards points for save and exposes them via /gamification/me', async () => {
    const admin = await makeAdmin(ctx.app);
    const place = await createPlace(ctx.app, admin);
    const user = await registerAndLogin(ctx.app);
    await savePlace(ctx.app, user, place.id);

    const me = await request(ctx.httpServer)
      .get('/gamification/me')
      .set(authHeader(user.token))
      .expect(200);

    expect(me.body.points).toBeGreaterThanOrEqual(10); // POINTS.save = 10
    expect(me.body.level).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(me.body.achievements)).toBe(true);
  });

  it('does not double-award when the same place is saved twice', async () => {
    const admin = await makeAdmin(ctx.app);
    const place = await createPlace(ctx.app, admin);
    const user = await registerAndLogin(ctx.app);
    await savePlace(ctx.app, user, place.id);

    // Second save attempt rejected by service.
    const dup = await request(ctx.httpServer)
      .post(`/saved/${place.id}`)
      .set(authHeader(user.token));
    expect([400, 409]).toContain(dup.status);

    const me = await request(ctx.httpServer)
      .get('/gamification/me')
      .set(authHeader(user.token))
      .expect(200);
    // Only one save credited (10 pts), not 20.
    expect(me.body.points).toBe(10);
  });
});
