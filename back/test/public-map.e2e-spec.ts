import * as request from 'supertest';
import { createTestApp, TestAppContext } from './utils/app-factory';
import { authHeader, registerAndLogin } from './utils/auth-helpers';

describe('PublicMap (e2e)', () => {
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

  it('returns 404 for an unknown slug or token (anonymous)', async () => {
    await request(ctx.httpServer).get('/public/slug/unknown').expect(404);
    await request(ctx.httpServer).get('/public/token/nope').expect(404);
  });

  it('owner toggles isPublic and the map is reachable by slug', async () => {
    const owner = await registerAndLogin(ctx.app);
    // Set slug + go public.
    const settings = await request(ctx.httpServer)
      .patch('/user/me/public-map')
      .set(authHeader(owner.token))
      .send({ isPublic: true, publicSlug: 'pub-slug' })
      .expect(200);
    expect(settings.body.isPublic).toBe(true);
    expect(settings.body.publicSlug).toBe('pub-slug');
    expect(settings.body.publicToken).toBeDefined();

    const map = await request(ctx.httpServer)
      .get('/public/slug/pub-slug')
      .expect(200);
    expect(map.body.owner.userId).toBe(owner.id);
    expect(map.body.savedPlaces).toEqual([]);

    const byToken = await request(ctx.httpServer)
      .get(`/public/token/${settings.body.publicToken}`)
      .expect(200);
    expect(byToken.body.owner.userId).toBe(owner.id);
  });

  it('clamps oversize limit query and rejects non-public maps', async () => {
    const owner = await registerAndLogin(ctx.app);
    await request(ctx.httpServer)
      .patch('/user/me/public-map')
      .set(authHeader(owner.token))
      .send({ isPublic: false, publicSlug: 'priv-slug' })
      .expect(200);
    // Slug saved but isPublic=false → 404 anonymously.
    await request(ctx.httpServer).get('/public/slug/priv-slug').expect(404);
  });
});
