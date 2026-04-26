import * as request from 'supertest';
import { createTestApp, TestAppContext } from './utils/app-factory';
import { authHeader, makeAdmin, registerAndLogin } from './utils/auth-helpers';
import { createPlace, createTag, savePlace } from './utils/fixtures';

describe('Saved (e2e)', () => {
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

  it('saves a place, then refuses to save it twice', async () => {
    const admin = await makeAdmin(ctx.app);
    const place = await createPlace(ctx.app, admin);
    const user = await registerAndLogin(ctx.app);
    await savePlace(ctx.app, user, place.id);

    const res = await request(ctx.httpServer)
      .post(`/saved/${place.id}`)
      .set(authHeader(user.token));
    expect([400, 409]).toContain(res.status);
  });

  it('lists saved places (newest first), then unsaves them', async () => {
    const admin = await makeAdmin(ctx.app);
    const p1 = await createPlace(ctx.app, admin, { name: 'A' });
    const p2 = await createPlace(ctx.app, admin, { name: 'B' });
    const user = await registerAndLogin(ctx.app);
    const sp1 = await savePlace(ctx.app, user, p1.id);
    const sp2 = await savePlace(ctx.app, user, p2.id);

    const list = await request(ctx.httpServer)
      .get('/saved')
      .set(authHeader(user.token))
      .expect(200);
    expect(list.body).toHaveLength(2);
    expect(list.body[0].id).toBe(sp2);
    expect(list.body[1].id).toBe(sp1);

    await request(ctx.httpServer)
      .delete(`/saved/${sp1}`)
      .set(authHeader(user.token))
      .expect(204);

    await request(ctx.httpServer)
      .delete(`/saved/${sp1}`)
      .set(authHeader(user.token))
      .expect(404);
  });

  it('rejects rating outside 0..5 with 400', async () => {
    const admin = await makeAdmin(ctx.app);
    const place = await createPlace(ctx.app, admin);
    const user = await registerAndLogin(ctx.app);
    const savedId = await savePlace(ctx.app, user, place.id);

    await request(ctx.httpServer)
      .put(`/saved/${savedId}/rating`)
      .set(authHeader(user.token))
      .send({ rating: 6 })
      .expect(400);

    await request(ctx.httpServer)
      .put(`/saved/${savedId}/rating`)
      .set(authHeader(user.token))
      .send({ rating: -1 })
      .expect(400);

    await request(ctx.httpServer)
      .put(`/saved/${savedId}/rating`)
      .set(authHeader(user.token))
      .send({ rating: 4 })
      .expect(200);
  });

  it('rejects an empty comment with 400', async () => {
    const admin = await makeAdmin(ctx.app);
    const place = await createPlace(ctx.app, admin);
    const user = await registerAndLogin(ctx.app);
    const savedId = await savePlace(ctx.app, user, place.id);

    await request(ctx.httpServer)
      .put(`/saved/${savedId}/comment`)
      .set(authHeader(user.token))
      .send({ comment: '' })
      .expect(400);
  });

  it('toggles done and filters by tag', async () => {
    const admin = await makeAdmin(ctx.app);
    const p1 = await createPlace(ctx.app, admin, { name: 'X' });
    const p2 = await createPlace(ctx.app, admin, { name: 'Y' });
    const user = await registerAndLogin(ctx.app);
    const sp1 = await savePlace(ctx.app, user, p1.id);
    const sp2 = await savePlace(ctx.app, user, p2.id);
    const tag = await createTag(ctx.app, user, { name: 'fav' });

    await request(ctx.httpServer)
      .put(`/saved/${sp1}/tag/${tag.id}`)
      .set(authHeader(user.token))
      .expect(201);

    await request(ctx.httpServer)
      .patch(`/saved/${sp2}/done`)
      .set(authHeader(user.token))
      .expect(204);

    const filtered = await request(ctx.httpServer)
      .get(`/saved?tagIds=${tag.id}`)
      .set(authHeader(user.token))
      .expect(200);
    expect(filtered.body).toHaveLength(1);
    expect(filtered.body[0].id).toBe(sp1);

    const done = await request(ctx.httpServer)
      .get('/saved?done=true')
      .set(authHeader(user.token))
      .expect(200);
    expect(done.body).toHaveLength(1);
    expect(done.body[0].id).toBe(sp2);
  });
});
