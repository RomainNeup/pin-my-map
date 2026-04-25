// jose uses ESM — mock the entire jose.service module so Jest never loads it.
jest.mock('./jose.service');

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { JoseService } from './jose.service';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { AuditService } from '../audit/audit.service';
import { MailerService } from '../mailer/mailer.service';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function makeUser(overrides: Record<string, unknown> = {}) {
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

function buildModule(userModelStub: object) {
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

describe('AuthService — forgotPassword', () => {
  let service: AuthService;
  let mailerService: { sendMail: jest.Mock };
  let auditService: { log: jest.Mock };
  let userModel: { findOne: jest.Mock };

  beforeEach(async () => {
    userModel = { findOne: jest.fn() };
    const module: TestingModule = await buildModule(userModel);
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
    const user = makeUser();
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
    const user = makeUser();
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
    const user = makeUser();
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
    const module: TestingModule = await buildModule(userModel);
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
    const user = makeUser({
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
    const user = makeUser({
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
