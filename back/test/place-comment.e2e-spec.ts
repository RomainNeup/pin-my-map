import * as request from 'supertest';
import { createTestApp, TestAppContext } from './utils/app-factory';
import { authHeader, makeAdmin, registerAndLogin } from './utils/auth-helpers';
import { createPlace, savePlace } from './utils/fixtures';

describe('PlaceComment (e2e)', () => {
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

  it('rejects comments on saved places of non-public users (404)', async () => {
    const admin = await makeAdmin(ctx.app);
    const place = await createPlace(ctx.app, admin);
    const owner = await registerAndLogin(ctx.app);
    const savedId = await savePlace(ctx.app, owner, place.id);

    const stranger = await registerAndLogin(ctx.app);
    await request(ctx.httpServer)
      .post(`/comments/saved/${savedId}`)
      .set(authHeader(stranger.token))
      .send({ body: 'hello' })
      .expect(404);
  });

  it('public-mapped owner allows comments and only the author can delete', async () => {
    const admin = await makeAdmin(ctx.app);
    const place = await createPlace(ctx.app, admin);
    const owner = await registerAndLogin(ctx.app);
    await request(ctx.httpServer)
      .patch('/user/me/public-map')
      .set(authHeader(owner.token))
      .send({ isPublic: true, publicSlug: 'pub-comments' })
      .expect(200);
    const savedId = await savePlace(ctx.app, owner, place.id);

    const author = await registerAndLogin(ctx.app);
    const created = await request(ctx.httpServer)
      .post(`/comments/saved/${savedId}`)
      .set(authHeader(author.token))
      .send({ body: 'nice spot' })
      .expect(201);
    expect(created.body.body).toBe('nice spot');

    // Public list (no auth needed).
    const list = await request(ctx.httpServer)
      .get(`/comments/saved/${savedId}`)
      .expect(200);
    expect(list.body).toHaveLength(1);

    // Empty body rejected.
    await request(ctx.httpServer)
      .post(`/comments/saved/${savedId}`)
      .set(authHeader(author.token))
      .send({ body: '' })
      .expect(400);

    // Stranger cannot delete.
    const stranger = await registerAndLogin(ctx.app);
    await request(ctx.httpServer)
      .delete(`/comments/${created.body.id}`)
      .set(authHeader(stranger.token))
      .expect(403);

    // Author can delete.
    await request(ctx.httpServer)
      .delete(`/comments/${created.body.id}`)
      .set(authHeader(author.token))
      .expect(204);
  });
});
