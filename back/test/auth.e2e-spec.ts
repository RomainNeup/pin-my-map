import * as request from 'supertest';
import { createTestApp, TestAppContext } from './utils/app-factory';
import { authHeader, registerAndLogin } from './utils/auth-helpers';

describe('Auth (e2e)', () => {
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

  it('registers a new user, allows login, and returns the profile', async () => {
    const email = 'reg@test.local';
    await request(ctx.httpServer)
      .post('/auth/register')
      .send({ email, password: 'password123', name: 'Reg User' })
      .expect(201);

    const login = await request(ctx.httpServer)
      .post('/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);
    expect(login.body.accessToken).toEqual(expect.any(String));

    const me = await request(ctx.httpServer)
      .get('/auth/me')
      .set(authHeader(login.body.accessToken))
      .expect(200);
    expect(me.body.email).toBe(email);
    // First user becomes admin.
    expect(me.body.role).toBe('admin');
  });

  it('rejects duplicate email registration', async () => {
    await registerAndLogin(ctx.app, { email: 'dup@test.local' });
    const res = await request(ctx.httpServer)
      .post('/auth/register')
      .send({ email: 'dup@test.local', password: 'password123', name: 'X' });
    // Service throws BadRequestException; either way 4xx with requestId.
    expect([400, 409]).toContain(res.status);
    expect(res.body.requestId).toBeDefined();
  });

  it('rejects an invalid email shape with 400', async () => {
    const res = await request(ctx.httpServer)
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'password123', name: 'X' })
      .expect(400);
    expect(res.body.requestId).toBeDefined();
  });

  it('rejects login with wrong password (401)', async () => {
    await registerAndLogin(ctx.app, { email: 'pw@test.local' });
    const res = await request(ctx.httpServer)
      .post('/auth/login')
      .send({ email: 'pw@test.local', password: 'WRONG-pass' })
      .expect(401);
    expect(res.body.requestId).toBeDefined();
  });

  it('rejects /auth/me with no token (401)', async () => {
    await request(ctx.httpServer).get('/auth/me').expect(401);
  });

  it('rejects /auth/me with an expired/invalid token (401)', async () => {
    await request(ctx.httpServer)
      .get('/auth/me')
      .set(authHeader('not-a-valid-jwt'))
      .expect(401);
  });

  it('forgot-password returns 204 even when the email is unknown (no enumeration)', async () => {
    await request(ctx.httpServer)
      .post('/auth/forgot-password')
      .send({ email: 'nobody@test.local' })
      .expect(204);
  });

  it('reset-password returns 400 for an unknown token', async () => {
    const fakeToken = 'a'.repeat(64);
    const res = await request(ctx.httpServer)
      .post('/auth/reset-password')
      .send({ token: fakeToken, newPassword: 'newPassword123' })
      .expect(400);
    expect(res.body.requestId).toBeDefined();
  });

  it('OAuth google returns 503 when GOOGLE_OAUTH_CLIENT_ID is unset', async () => {
    const res = await request(ctx.httpServer)
      .post('/auth/oauth/google')
      .send({ idToken: 'x'.repeat(50) });
    expect(res.status).toBe(503);
  });

  it('rejects unknown body fields when forbidNonWhitelisted is set', async () => {
    const res = await request(ctx.httpServer).post('/auth/login').send({
      email: 'x@test.local',
      password: 'password123',
      evilField: '<script>',
    });
    expect(res.status).toBe(400);
  });
});
