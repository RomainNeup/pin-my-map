import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JoseService } from './jose.service';

interface FakeUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'pending';
  googleId?: string;
  appleSub?: string;
  save: jest.Mock;
}

function makeFakeUser(partial: Partial<FakeUser> = {}): FakeUser {
  const user: FakeUser = {
    id: partial.id ?? 'u1',
    name: partial.name ?? 'Alice',
    email: partial.email ?? 'alice@example.com',
    role: partial.role ?? 'user',
    status: partial.status ?? 'active',
    googleId: partial.googleId,
    appleSub: partial.appleSub,
    save: jest.fn().mockResolvedValue(undefined),
  };
  return user;
}

describe('AuthService — OAuth', () => {
  let userModel: {
    findOne: jest.Mock;
    create: jest.Mock;
    countDocuments: jest.Mock;
  };
  let userService: {
    findByEmail: jest.Mock;
    exists: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
  };
  let joseService: JoseService;
  let oauthVerifier: { verify: jest.Mock };
  let auditService: { log: jest.Mock };
  let service: AuthService;

  const queryWith = (value: unknown) => ({
    exec: jest.fn().mockResolvedValue(value),
  });

  beforeEach(() => {
    process.env.GOOGLE_OAUTH_CLIENT_ID = 'gclient';
    process.env.APPLE_OAUTH_CLIENT_ID = 'aclient';
    process.env.REGISTRATION_MODE = 'open';

    userModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      countDocuments: jest.fn().mockReturnValue(queryWith(5)),
    };
    userService = {
      findByEmail: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    };
    joseService = {
      signAsync: jest.fn().mockResolvedValue('signed-jwt'),
      verifyAsync: jest.fn(),
    } as unknown as JoseService;
    oauthVerifier = { verify: jest.fn() };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };

    service = new AuthService(
      userService as any,
      joseService,

      oauthVerifier as any,

      auditService as any,

      userModel as any,
    );
  });

  describe('loginWithGoogle', () => {
    it('returns a JWT for an existing user matched by googleId (happy path)', async () => {
      oauthVerifier.verify.mockResolvedValue({
        sub: 'g-sub-1',
        email: 'alice@example.com',
        name: 'Alice',
      });
      const existing = makeFakeUser({ googleId: 'g-sub-1' });
      userModel.findOne.mockReturnValueOnce(queryWith(existing));

      const result = await service.loginWithGoogle('id-token');

      expect(oauthVerifier.verify).toHaveBeenCalledWith('google', 'id-token');
      expect(userModel.findOne).toHaveBeenCalledWith({ googleId: 'g-sub-1' });
      expect(result.accessToken).toBe('signed-jwt');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.oauth.login' }),
      );
    });

    it('rejects when the verifier throws (invalid token)', async () => {
      oauthVerifier.verify.mockRejectedValue(
        new UnauthorizedException('Invalid OAuth token'),
      );
      await expect(service.loginWithGoogle('bad')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('links an existing email-matched user when no googleId match', async () => {
      oauthVerifier.verify.mockResolvedValue({
        sub: 'g-sub-2',
        email: 'bob@example.com',
        name: 'Bob',
      });
      const linkable = makeFakeUser({ id: 'u2', email: 'bob@example.com' });
      userModel.findOne
        .mockReturnValueOnce(queryWith(null)) // by googleId
        .mockReturnValueOnce(queryWith(linkable)); // by email

      await service.loginWithGoogle('tok');

      expect(linkable.googleId).toBe('g-sub-2');
      expect(linkable.save).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.oauth.login' }),
      );
      // No register audit when linking.
      expect(auditService.log).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.oauth.register' }),
      );
    });

    it('creates a new active user when registrationMode=open', async () => {
      process.env.REGISTRATION_MODE = 'open';
      oauthVerifier.verify.mockResolvedValue({
        sub: 'g-new',
        email: 'new@example.com',
        name: 'New User',
      });
      userModel.findOne
        .mockReturnValueOnce(queryWith(null))
        .mockReturnValueOnce(queryWith(null));
      const created = makeFakeUser({
        id: 'u3',
        email: 'new@example.com',
        googleId: 'g-new',
      });
      userModel.create.mockResolvedValue(created);

      const result = await service.loginWithGoogle('tok');

      expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          status: 'active',
          googleId: 'g-new',
        }),
      );
      expect(result.accessToken).toBe('signed-jwt');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.oauth.register' }),
      );
    });

    it('creates a pending user when registrationMode=approval-required and blocks login', async () => {
      process.env.REGISTRATION_MODE = 'approval-required';
      oauthVerifier.verify.mockResolvedValue({
        sub: 'g-pending',
        email: 'pending@example.com',
      });
      userModel.findOne
        .mockReturnValueOnce(queryWith(null))
        .mockReturnValueOnce(queryWith(null));
      const created = makeFakeUser({
        id: 'u4',
        email: 'pending@example.com',
        status: 'pending',
        googleId: 'g-pending',
      });
      userModel.create.mockResolvedValue(created);

      await expect(service.loginWithGoogle('tok')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' }),
      );
    });

    it('blocks new sign-ups under registrationMode=invite-only', async () => {
      process.env.REGISTRATION_MODE = 'invite-only';
      oauthVerifier.verify.mockResolvedValue({
        sub: 'g-blocked',
        email: 'nope@example.com',
      });
      userModel.findOne
        .mockReturnValueOnce(queryWith(null))
        .mockReturnValueOnce(queryWith(null));

      await expect(service.loginWithGoogle('tok')).rejects.toMatchObject({
        message: expect.stringMatching(/invite-only/i),
      });
      expect(userModel.create).not.toHaveBeenCalled();
    });

    it('still allows existing-by-email link under invite-only', async () => {
      process.env.REGISTRATION_MODE = 'invite-only';
      oauthVerifier.verify.mockResolvedValue({
        sub: 'g-link',
        email: 'existing@example.com',
      });
      const linkable = makeFakeUser({
        id: 'u5',
        email: 'existing@example.com',
      });
      userModel.findOne
        .mockReturnValueOnce(queryWith(null))
        .mockReturnValueOnce(queryWith(linkable));

      const result = await service.loginWithGoogle('tok');
      expect(result.accessToken).toBe('signed-jwt');
      expect(linkable.googleId).toBe('g-link');
    });
  });

  describe('loginWithApple', () => {
    it('uses request name when token omits it', async () => {
      oauthVerifier.verify.mockResolvedValue({
        sub: 'a-sub-1',
        email: 'fresh@example.com',
      });
      userModel.findOne
        .mockReturnValueOnce(queryWith(null))
        .mockReturnValueOnce(queryWith(null));
      const created = makeFakeUser({
        id: 'u6',
        email: 'fresh@example.com',
        appleSub: 'a-sub-1',
      });
      userModel.create.mockResolvedValue(created);

      await service.loginWithApple('tok', 'Sent From Client');

      expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Sent From Client',
          appleSub: 'a-sub-1',
        }),
      );
    });

    it('falls back to email local-part when no name is provided', async () => {
      oauthVerifier.verify.mockResolvedValue({
        sub: 'a-sub-2',
        email: 'jane.doe@example.com',
      });
      userModel.findOne
        .mockReturnValueOnce(queryWith(null))
        .mockReturnValueOnce(queryWith(null));
      const created = makeFakeUser({
        id: 'u7',
        email: 'jane.doe@example.com',
        appleSub: 'a-sub-2',
      });
      userModel.create.mockResolvedValue(created);

      await service.loginWithApple('tok');

      expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'jane.doe' }),
      );
    });

    it('finds existing user by appleSub', async () => {
      oauthVerifier.verify.mockResolvedValue({
        sub: 'a-sub-3',
        email: 'a@example.com',
      });
      const existing = makeFakeUser({ appleSub: 'a-sub-3' });
      userModel.findOne.mockReturnValueOnce(queryWith(existing));

      const result = await service.loginWithApple('tok');
      expect(userModel.findOne).toHaveBeenCalledWith({ appleSub: 'a-sub-3' });
      expect(result.accessToken).toBe('signed-jwt');
    });
  });
});
