import * as request from 'supertest';
import { createTestApp, TestAppContext } from './utils/app-factory';
import { authHeader, makeAdmin, registerAndLogin } from './utils/auth-helpers';

describe('Audit (e2e)', () => {
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

  it('returns 403 for non-admin GET /audit', async () => {
    // First registered user becomes admin automatically; consume that slot
    // before registering the user under test.
    await makeAdmin(ctx.app);
    const user = await registerAndLogin(ctx.app);
    await request(ctx.httpServer)
      .get('/audit')
      .set(authHeader(user.token))
      .expect(403);
  });

  it('records audit entries from sensitive admin actions', async () => {
    const admin = await makeAdmin(ctx.app);
    const owner = await registerAndLogin(ctx.app);
    // Owner creates a pending place.
    const placeRes = await request(ctx.httpServer)
      .post('/place')
      .set(authHeader(owner.token))
      .send({
        name: 'P',
        description: 'A nice spot for testing audits.',
        address: 'Audit street',
        location: { lat: 0, lng: 0 },
      })
      .expect(201);
    // Admin updates → should generate place.update audit log.
    await request(ctx.httpServer)
      .put(`/place/${placeRes.body.id}`)
      .set(authHeader(admin.token))
      .send({
        name: 'P-edited',
        description: 'A nice spot for testing audits.',
        address: 'Audit street',
        location: { lat: 0, lng: 0 },
      })
      .expect(200);

    const list = await request(ctx.httpServer)
      .get('/audit')
      .set(authHeader(admin.token))
      .expect(200);
    expect(list.body.length).toBeGreaterThan(0);
    const placeUpdate = list.body.find(
      (e: { action: string }) => e.action === 'place.update',
    );
    expect(placeUpdate).toBeDefined();
  });
});
