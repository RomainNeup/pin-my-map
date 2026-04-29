import * as request from 'supertest';
import { createTestApp, TestAppContext } from './utils/app-factory';
import { authHeader, makeAdmin, registerAndLogin } from './utils/auth-helpers';
import { createPlace, createTag, savePlace } from './utils/fixtures';

describe('Tag (e2e)', () => {
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

  it('creates, lists, updates and deletes tags', async () => {
    const user = await registerAndLogin(ctx.app);
    const tag = await createTag(ctx.app, user, { name: 'food' });

    const list = await request(ctx.httpServer)
      .get('/tag')
      .set(authHeader(user.token))
      .expect(200);
    expect(list.body).toHaveLength(1);

    await request(ctx.httpServer)
      .put(`/tag/${tag.id}`)
      .set(authHeader(user.token))
      .send({ name: 'eats', emoji: '🍔' })
      .expect(200);

    await request(ctx.httpServer)
      .delete(`/tag/${tag.id}`)
      .set(authHeader(user.token))
      .expect(204);
  });

  it('rejects duplicate tag names with 409', async () => {
    const user = await registerAndLogin(ctx.app);
    await createTag(ctx.app, user, { name: 'dup' });
    const res = await request(ctx.httpServer)
      .post('/tag')
      .set(authHeader(user.token))
      .send({ name: 'dup', emoji: '🍕' })
      .expect(409);
    expect(res.body.requestId).toBeDefined();
  });

  it('removes a deleted tag from saved places', async () => {
    const admin = await makeAdmin(ctx.app);
    const place = await createPlace(ctx.app, admin);
    const user = await registerAndLogin(ctx.app);
    const savedId = await savePlace(ctx.app, user, place.id);
    const tag = await createTag(ctx.app, user, { name: 'sushi' });

    await request(ctx.httpServer)
      .put(`/saved/${savedId}/tag/${tag.id}`)
      .set(authHeader(user.token))
      .expect(201);

    await request(ctx.httpServer)
      .delete(`/tag/${tag.id}`)
      .set(authHeader(user.token))
      .expect(204);

    const saved = await request(ctx.httpServer)
      .get(`/saved/${savedId}`)
      .set(authHeader(user.token))
      .expect(200);
    expect(saved.body.tags).toHaveLength(0);
  });
});
