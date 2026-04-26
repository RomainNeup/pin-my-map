import * as request from 'supertest';
import { createTestApp, TestAppContext } from './utils/app-factory';
import { authHeader, registerAndLogin } from './utils/auth-helpers';

describe('Import (e2e)', () => {
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

  it('imports a tiny Mapstr GeoJSON and reports the summary', async () => {
    const user = await registerAndLogin(ctx.app);

    const geo = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
          properties: {
            name: 'Le Mary Celeste',
            address: '1 Rue Commines, Paris',
            userComment: 'Great cocktails',
            tags: [{ name: '🍸 cocktail bar' }],
          },
        },
      ],
    };

    const res = await request(ctx.httpServer)
      .post('/import/mapstr')
      .set(authHeader(user.token))
      .attach('file', Buffer.from(JSON.stringify(geo)), 'mapstr.json')
      .expect(200);

    expect(res.body.imported).toBe(1);
    expect(res.body.failed).toBe(0);
  });

  it('rejects a non-JSON upload with 400', async () => {
    const user = await registerAndLogin(ctx.app);
    const res = await request(ctx.httpServer)
      .post('/import/mapstr')
      .set(authHeader(user.token))
      .attach('file', Buffer.from('this is not json'), 'bogus.json')
      .expect(400);
    expect(res.body.requestId).toBeDefined();
  });

  it('rejects a JSON object that is not a FeatureCollection (400)', async () => {
    const user = await registerAndLogin(ctx.app);
    await request(ctx.httpServer)
      .post('/import/mapstr')
      .set(authHeader(user.token))
      .attach('file', Buffer.from(JSON.stringify({ foo: 'bar' })), 'm.json')
      .expect(400);
  });
});
