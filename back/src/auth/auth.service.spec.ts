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

  // ------------------------------------------------------------------
  // login
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // register – TAS-20 registrationMode flow
  // ------------------------------------------------------------------
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
      userService.count.mockResolvedValue(5); // not first user

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
      userService.count.mockResolvedValue(0); // first user

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
    // the audit entry must not carry the raw token
    expect(auditArg).not.toMatch(/"token"/);
  });

  it('stores a sha256 hash, not the plain token', async () => {
    const user = makeResetUser();
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });

    await service.forgotPassword('test@example.com');

    // The email link contains the plain token; the entity stores the hash.
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
