import * as request from 'supertest';
import { createTestApp, TestAppContext } from './utils/app-factory';
import { authHeader, makeAdmin, registerAndLogin } from './utils/auth-helpers';
import { createPlace } from './utils/fixtures';

describe('Suggestion (e2e)', () => {
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

  it('lets a user submit a suggestion; admin lists and approves it', async () => {
    const admin = await makeAdmin(ctx.app);
    const place = await createPlace(ctx.app, admin, { name: 'Original' });
    const user = await registerAndLogin(ctx.app);

    const created = await request(ctx.httpServer)
      .post('/suggestion')
      .set(authHeader(user.token))
      .send({
        placeId: place.id,
        changes: { name: 'Updated Name' },
        note: 'Better name',
      })
      .expect(201);
    expect(created.body.placeId).toBe(place.id);

    // Admin-only listing.
    await request(ctx.httpServer)
      .get('/suggestion')
      .set(authHeader(user.token))
      .expect(403);

    const list = await request(ctx.httpServer)
      .get('/suggestion')
      .set(authHeader(admin.token))
      .expect(200);
    expect(list.body).toHaveLength(1);

    // Approve.
    await request(ctx.httpServer)
      .post(`/suggestion/${created.body.id}/approve`)
      .set(authHeader(admin.token))
      .expect(200);

    const updated = await request(ctx.httpServer)
      .get(`/place/${place.id}`)
      .set(authHeader(user.token))
      .expect(200);
    expect(updated.body.name).toBe('Updated Name');
  });

  it('rejects a suggestion with no actual changes (400)', async () => {
    const admin = await makeAdmin(ctx.app);
    const place = await createPlace(ctx.app, admin, { name: 'Same' });
    const user = await registerAndLogin(ctx.app);
    await request(ctx.httpServer)
      .post('/suggestion')
      .set(authHeader(user.token))
      .send({
        placeId: place.id,
        changes: { name: 'Same' },
      })
      .expect(400);
  });
});
