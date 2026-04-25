import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { ConfigService } from 'src/config/config.service';

// Prevent Jest from loading the actual jose ESM package.
// JoseService is fully mocked in the provider list below.
jest.mock('./jose.service');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { JoseService } = require('./jose.service') as {
  JoseService: new () => { signAsync: jest.Mock };
};

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
