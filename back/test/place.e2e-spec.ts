import * as request from 'supertest';
import { createTestApp, TestAppContext } from './utils/app-factory';
import { authHeader, makeAdmin, registerAndLogin } from './utils/auth-helpers';
import { createPlace } from './utils/fixtures';
import { cleanAllStubs } from './utils/external-stubs';

describe('Place (e2e)', () => {
  let ctx: TestAppContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    cleanAllStubs();
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.clearDatabase();
    cleanAllStubs();
  });

  it('admin creates an approved place visible to other users', async () => {
    const admin = await makeAdmin(ctx.app);
    const { id } = await createPlace(ctx.app, admin, { name: 'Pizzeria' });

    const user = await registerAndLogin(ctx.app);
    const res = await request(ctx.httpServer)
      .get(`/place/${id}`)
      .set(authHeader(user.token))
      .expect(200);
    expect(res.body.name).toBe('Pizzeria');
    expect(res.body.saveCount).toBe(0);
  });

  it('rejects place creation with too-short description (400)', async () => {
    const admin = await makeAdmin(ctx.app);
    const res = await request(ctx.httpServer)
      .post('/place')
      .set(authHeader(admin.token))
      .send({
        name: 'X',
        description: 'tiny',
        address: 'Somewhere',
        location: { lat: 0, lng: 0 },
      })
      .expect(400);
    expect(res.body.requestId).toBeDefined();
  });

  it('rejects place creation with out-of-range latitude (400)', async () => {
    const admin = await makeAdmin(ctx.app);
    await request(ctx.httpServer)
      .post('/place')
      .set(authHeader(admin.token))
      .send({
        name: 'X',
        description: 'A normal description for the place.',
        address: 'Somewhere',
        location: { lat: 95, lng: 0 },
      })
      .expect(400);
  });

  it('returns 404 for an unknown place id', async () => {
    const user = await registerAndLogin(ctx.app);
    await request(ctx.httpServer)
      .get('/place/507f1f77bcf86cd799439011')
      .set(authHeader(user.token))
      .expect(404);
  });

  it('rejects place updates from non-owner non-admin (403)', async () => {
    const admin = await makeAdmin(ctx.app);
    const owner = await registerAndLogin(ctx.app);
    // Owner creates → pending. Use admin to make a normal user owner via direct
    // creation: simpler — use admin path then transfer through DB? We instead
    // just create as the user (pending) and have a 3rd user attempt to edit.
    const res = await request(ctx.httpServer)
      .post('/place')
      .set(authHeader(owner.token))
      .send({
        name: 'Mine',
        description: 'A nice place created by the owner.',
        address: 'Owner street',
        location: { lat: 1, lng: 1 },
      })
      .expect(201);

    const stranger = await registerAndLogin(ctx.app);
    await request(ctx.httpServer)
      .put(`/place/${res.body.id}`)
      .set(authHeader(stranger.token))
      .send({
        name: 'Hijack',
        description: 'A nice place created by the owner.',
        address: 'Owner street',
        location: { lat: 1, lng: 1 },
      })
      .expect(403);

    // Admin can override.
    await request(ctx.httpServer)
      .put(`/place/${res.body.id}`)
      .set(authHeader(admin.token))
      .send({
        name: 'Approved',
        description: 'Updated by admin.',
        address: 'Owner street',
        location: { lat: 1, lng: 1 },
      })
      .expect(200);
  });

  it('searches places by name substring', async () => {
    const admin = await makeAdmin(ctx.app);
    await createPlace(ctx.app, admin, { name: 'Sushi Place' });
    await createPlace(ctx.app, admin, { name: 'Burger Joint' });
    const res = await request(ctx.httpServer)
      .get('/place/search?q=sushi')
      .set(authHeader(admin.token))
      .expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Sushi Place');
  });
});
