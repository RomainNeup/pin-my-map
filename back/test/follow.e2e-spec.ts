import * as request from 'supertest';
import { createTestApp, TestAppContext } from './utils/app-factory';
import { authHeader, registerAndLogin } from './utils/auth-helpers';

describe('Follow (e2e)', () => {
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

  it('rejects following yourself with 400', async () => {
    const me = await registerAndLogin(ctx.app);
    const res = await request(ctx.httpServer)
      .post(`/follow/${me.id}`)
      .set(authHeader(me.token))
      .expect(400);
    expect(res.body.requestId).toBeDefined();
  });

  it('rejects following an invalid user id with 400', async () => {
    const me = await registerAndLogin(ctx.app);
    await request(ctx.httpServer)
      .post('/follow/not-an-id')
      .set(authHeader(me.token))
      .expect(400);
  });

  it('returns 404 when following an unknown but valid id', async () => {
    const me = await registerAndLogin(ctx.app);
    await request(ctx.httpServer)
      .post('/follow/507f1f77bcf86cd799439011')
      .set(authHeader(me.token))
      .expect(404);
  });

  it('follow is idempotent and reflects in stats', async () => {
    const a = await registerAndLogin(ctx.app);
    const b = await registerAndLogin(ctx.app);
    await request(ctx.httpServer)
      .post(`/follow/${b.id}`)
      .set(authHeader(a.token))
      .expect(200);
    // Idempotent — second follow returns 200 with same stats.
    const second = await request(ctx.httpServer)
      .post(`/follow/${b.id}`)
      .set(authHeader(a.token))
      .expect(200);
    expect(second.body.isFollowing).toBe(true);
    expect(second.body.followerCount).toBe(1);

    const myFollowing = await request(ctx.httpServer)
      .get('/follow/me/following')
      .set(authHeader(a.token))
      .expect(200);
    expect(myFollowing.body).toHaveLength(1);
    expect(myFollowing.body[0].userId).toBe(b.id);

    const followers = await request(ctx.httpServer)
      .get('/follow/me/followers')
      .set(authHeader(b.token))
      .expect(200);
    expect(followers.body).toHaveLength(1);
    expect(followers.body[0].userId).toBe(a.id);

    await request(ctx.httpServer)
      .delete(`/follow/${b.id}`)
      .set(authHeader(a.token))
      .expect(200);

    const isF = await request(ctx.httpServer)
      .get(`/follow/${b.id}/is-following`)
      .set(authHeader(a.token))
      .expect(200);
    expect(isF.body.following).toBe(false);
  });
});
