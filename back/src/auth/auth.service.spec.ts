// jose uses ESM — mock the entire jose.service module so Jest never loads it.
jest.mock('./jose.service');

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { JoseService } from './jose.service';
import { OAuthVerifierService } from './oauth-verifier.service';
import { UserService } from '../user/user.service';
import { ConfigService } from 'src/config/config.service';
import { User } from '../user/user.entity';
import { AuditService } from '../audit/audit.service';
import { MailerService } from '../mailer/mailer.service';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function makeResetUser(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    passwordResetTokenHash: undefined as string | undefined,
    passwordResetExpiresAt: undefined as Date | undefined,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function buildResetModule(userModelStub: object) {
  return Test.createTestingModule({
    providers: [
      AuthService,
      { provide: getModelToken(User.name), useValue: userModelStub },
      {
        provide: UserService,
        useValue: {
          findByEmail: jest.fn(),
          exists: jest.fn(),
          count: jest.fn(),
          create: jest.fn(),
        },
      },
      {
        provide: JoseService,
        useValue: { signAsync: jest.fn() },
      },
      {
        provide: ConfigService,
        useValue: {
          get: jest.fn().mockResolvedValue({ registrationMode: 'open' }),
        },
      },
      {
        provide: OAuthVerifierService,
        useValue: { verify: jest.fn() },
      },
      {
        provide: AuditService,
        useValue: { log: jest.fn().mockResolvedValue(undefined) },
      },
      {
        provide: MailerService,
        useValue: { sendMail: jest.fn().mockResolvedValue(undefined) },
      },
    ],
  }).compile();
}

describe('AuthService', () => {
  let service: AuthService;
  let userService: {
    findByEmail: jest.Mock;
    exists: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
  };
  let joseService: { signAsync: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    userService = {
      findByEmail: jest.fn(),
      exists: jest.fn().mockResolvedValue(false),
      count: jest.fn().mockResolvedValue(1),
      create: jest
        .fn()
        .mockResolvedValue({ name: 'Alice', email: 'alice@example.com' }),
    };
    joseService = {
      signAsync: jest.fn().mockResolvedValue('token123'),
    };
    configService = {
      get: jest.fn().mockResolvedValue({ registrationMode: 'open' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JoseService, useValue: joseService },
        { provide: ConfigService, useValue: configService },
        {
          provide: OAuthVerifierService,
          useValue: { verify: jest.fn() },
        },
        { provide: getModelToken(User.name), useValue: { findOne: jest.fn() } },
        {
          provide: AuditService,
          useValue: { log: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: MailerService,
          useValue: { sendMail: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    const makeUser = (overrides: Record<string, unknown> = {}) => ({
      id: 'uid1',
      name: 'Alice',
      email: 'alice@example.com',
      password: '',
      role: 'user' as const,
      status: 'active' as const,
      ...overrides,
    });

    it('returns accessToken on valid credentials', async () => {
      const hashed = await bcrypt.hash('pass123', 10);
      userService.findByEmail.mockResolvedValue(makeUser({ password: hashed }));

      const result = await service.login({
        email: 'alice@example.com',
        password: 'pass123',
      });

      expect(result.accessToken).toBe('token123');
    });

    it('throws UnauthorizedException on wrong password', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      userService.findByEmail.mockResolvedValue(makeUser({ password: hashed }));

      await expect(
        service.login({ email: 'alice@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user not found', async () => {
      userService.findByEmail.mockRejectedValue(new Error('not found'));

      await expect(
        service.login({ email: 'nobody@example.com', password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws ForbiddenException with status info when user is pending', async () => {
      const hashed = await bcrypt.hash('pass123', 10);
      userService.findByEmail.mockResolvedValue(
        makeUser({ password: hashed, status: 'pending' }),
      );

      await expect(
        service.login({ email: 'alice@example.com', password: 'pass123' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException with reason when user is rejected', async () => {
      const hashed = await bcrypt.hash('pass123', 10);
      userService.findByEmail.mockResolvedValue(
        makeUser({
          password: hashed,
          status: 'rejected',
          rejectionReason: 'spam',
        }),
      );

      let err: ForbiddenException | undefined;
      try {
        await service.login({
          email: 'alice@example.com',
          password: 'pass123',
        });
      } catch (e) {
        err = e as ForbiddenException;
      }

      expect(err).toBeInstanceOf(ForbiddenException);
      expect((err?.getResponse() as { message: string }).message).toContain(
        'spam',
      );
    });

    it('throws ForbiddenException when user is suspended', async () => {
      const hashed = await bcrypt.hash('pass123', 10);
      userService.findByEmail.mockResolvedValue(
        makeUser({ password: hashed, status: 'suspended' }),
      );

      await expect(
        service.login({ email: 'alice@example.com', password: 'pass123' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('register', () => {
    it('creates active user when registrationMode is open', async () => {
      configService.get.mockResolvedValue({ registrationMode: 'open' });

      await service.register({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'pass1234',
      });

      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' }),
      );
    });

    it('creates pending user when registrationMode is approval-required', async () => {
      configService.get.mockResolvedValue({
        registrationMode: 'approval-required',
      });
      userService.count.mockResolvedValue(5);

      await service.register({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'pass1234',
      });

      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' }),
      );
    });

    it('first user is always active and admin regardless of mode', async () => {
      configService.get.mockResolvedValue({
        registrationMode: 'approval-required',
      });
      userService.count.mockResolvedValue(0);

      await service.register({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'pass1234',
      });

      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active', role: 'admin' }),
      );
    });

    it('throws ForbiddenException when registrationMode is invite-only', async () => {
      configService.get.mockResolvedValue({ registrationMode: 'invite-only' });

      await expect(
        service.register({
          name: 'Bob',
          email: 'bob@example.com',
          password: 'pass1234',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

describe('AuthService — forgotPassword', () => {
  let service: AuthService;
  let mailerService: { sendMail: jest.Mock };
  let auditService: { log: jest.Mock };
  let userModel: { findOne: jest.Mock };

  beforeEach(async () => {
    userModel = { findOne: jest.fn() };
    const module: TestingModule = await buildResetModule(userModel);
    service = module.get<AuthService>(AuthService);
    mailerService = module.get(MailerService);
    auditService = module.get(AuditService);
  });

  it('returns silently when user not found (no account-existence leak)', async () => {
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.forgotPassword('noone@example.com'),
    ).resolves.toBeUndefined();
    expect(mailerService.sendMail).not.toHaveBeenCalled();
    expect(auditService.log).not.toHaveBeenCalled();
  });

  it('generates a token, stores its hash (not plaintext), and emails the user', async () => {
    const user = makeResetUser();
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });

    await service.forgotPassword('test@example.com');

    expect(user.save).toHaveBeenCalled();
    expect(typeof user.passwordResetTokenHash).toBe('string');
    expect(user.passwordResetExpiresAt).toBeInstanceOf(Date);
    expect((user.passwordResetExpiresAt as Date).getTime()).toBeGreaterThan(
      Date.now() + 59 * 60 * 1000,
    );
    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'test@example.com' }),
    );
  });

  it('audits password_reset_requested without logging the token value', async () => {
    const user = makeResetUser();
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });

    await service.forgotPassword('test@example.com');

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.password_reset_requested' }),
    );
    const auditArg = JSON.stringify(auditService.log.mock.calls[0][0]);
    expect(auditArg).not.toMatch(/"token"/);
  });

  it('stores a sha256 hash, not the plain token', async () => {
    const user = makeResetUser();
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });

    await service.forgotPassword('test@example.com');

    const emailCall = mailerService.sendMail.mock.calls[0][0] as {
      html: string;
    };
    const tokenMatch = (emailCall.html as string).match(/token=([a-f0-9]{64})/);
    expect(tokenMatch).not.toBeNull();
    const plainToken = tokenMatch![1];
    expect(user.passwordResetTokenHash).toBe(sha256(plainToken));
  });
});

describe('AuthService — resetPassword', () => {
  let service: AuthService;
  let auditService: { log: jest.Mock };
  let userModel: { findOne: jest.Mock };

  beforeEach(async () => {
    userModel = { findOne: jest.fn() };
    const module: TestingModule = await buildResetModule(userModel);
    service = module.get<AuthService>(AuthService);
    auditService = module.get(AuditService);
  });

  it('throws 400 when no user matches the token hash', async () => {
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.resetPassword('a'.repeat(64), 'newpassword123'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws 400 and clears the stale token when expired', async () => {
    const pastDate = new Date(Date.now() - 1000);
    const user = makeResetUser({
      passwordResetTokenHash: sha256('a'.repeat(64)),
      passwordResetExpiresAt: pastDate,
    });
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });

    await expect(
      service.resetPassword('a'.repeat(64), 'newpassword123'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(user.passwordResetTokenHash).toBeUndefined();
    expect(user.passwordResetExpiresAt).toBeUndefined();
    expect(user.save).toHaveBeenCalled();
  });

  it('updates password, clears token, and audits on success', async () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    const plainToken = 'b'.repeat(64);
    const user = makeResetUser({
      passwordResetTokenHash: sha256(plainToken),
      passwordResetExpiresAt: futureDate,
    });
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });

    await service.resetPassword(plainToken, 'newsecurepassword');

    expect(user.password).not.toBe('$2b$10$hashedpassword');
    expect(user.passwordResetTokenHash).toBeUndefined();
    expect(user.passwordResetExpiresAt).toBeUndefined();
    expect(user.save).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.password_reset_completed' }),
    );
  });
});

interface FakeOAuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'pending' | 'rejected' | 'suspended';
  rejectionReason?: string;
  googleId?: string;
  appleSub?: string;
  save: jest.Mock;
}

function makeFakeUser(partial: Partial<FakeOAuthUser> = {}): FakeOAuthUser {
  return {
    id: partial.id ?? 'u1',
    name: partial.name ?? 'Alice',
    email: partial.email ?? 'alice@example.com',
    role: partial.role ?? 'user',
    status: partial.status ?? 'active',
    rejectionReason: partial.rejectionReason,
    googleId: partial.googleId,
    appleSub: partial.appleSub,
    save: jest.fn().mockResolvedValue(undefined),
  };
}

describe('AuthService — OAuth', () => {
  let userModel: {
    findOne: jest.Mock;
    create: jest.Mock;
    countDocuments: jest.Mock;
  };
  let oauthVerifier: { verify: jest.Mock };
  let auditService: { log: jest.Mock };
  let configService: { get: jest.Mock };
  let service: AuthService;

  const queryWith = (value: unknown) => ({
    exec: jest.fn().mockResolvedValue(value),
  });

  beforeEach(async () => {
    userModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      countDocuments: jest.fn().mockReturnValue(queryWith(5)),
    };
    oauthVerifier = { verify: jest.fn() };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };
    configService = {
      get: jest.fn().mockResolvedValue({ registrationMode: 'open' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModel },
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            exists: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JoseService,
          useValue: { signAsync: jest.fn().mockResolvedValue('signed-jwt') },
        },
        { provide: ConfigService, useValue: configService },
        { provide: OAuthVerifierService, useValue: oauthVerifier },
        { provide: AuditService, useValue: auditService },
        {
          provide: MailerService,
          useValue: { sendMail: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
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
        .mockReturnValueOnce(queryWith(null))
        .mockReturnValueOnce(queryWith(linkable));

      await service.loginWithGoogle('tok');

      expect(linkable.googleId).toBe('g-sub-2');
      expect(linkable.save).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.oauth.login' }),
      );
      expect(auditService.log).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.oauth.register' }),
      );
    });

    it('creates a new active user when registrationMode=open', async () => {
      configService.get.mockResolvedValue({ registrationMode: 'open' });
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
      configService.get.mockResolvedValue({
        registrationMode: 'approval-required',
      });
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
      configService.get.mockResolvedValue({ registrationMode: 'invite-only' });
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
      configService.get.mockResolvedValue({ registrationMode: 'invite-only' });
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
