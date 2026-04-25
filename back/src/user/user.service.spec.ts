import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { UserService } from './user.service';
import { User } from './user.entity';
import { UserGamification } from 'src/gamification/gamification.entity';

// Minimal helpers
const makeId = () => new Types.ObjectId().toHexString();

function makeDoc(overrides: Record<string, unknown> = {}) {
  const _id = new Types.ObjectId();
  const base: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    status: 'active' | 'pending' | 'rejected' | 'suspended';
    isPublic: boolean;
    rejectionReason?: string;
    publicSlug?: string;
    publicToken?: string;
    save: jest.Mock;
    [key: string]: unknown;
  } = {
    _id,
    name: 'Alice',
    email: 'alice@example.com',
    password: '$2b$10$placeholder',
    role: 'user',
    status: 'active',
    isPublic: false,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return base;
}

describe('UserService', () => {
  let service: UserService;
  let userModel: {
    findById: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    exists: jest.Mock;
    create: jest.Mock;
    updateMany: jest.Mock;
    countDocuments: jest.Mock;
    deleteOne: jest.Mock;
  };
  let gamificationModel: { find: jest.Mock };

  beforeEach(async () => {
    userModel = {
      findById: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      exists: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({}),
      countDocuments: jest.fn().mockResolvedValue(1),
      deleteOne: jest.fn().mockResolvedValue({}),
    };
    gamificationModel = {
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: userModel },
        {
          provide: getModelToken(UserGamification.name),
          useValue: gamificationModel,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  // ------------------------------------------------------------------
  // onModuleInit backfill
  // ------------------------------------------------------------------
  describe('onModuleInit', () => {
    it('backfills users without status to active', async () => {
      await service.onModuleInit();
      expect(userModel.updateMany).toHaveBeenCalledWith(
        { status: { $exists: false } },
        { $set: { status: 'active' } },
      );
    });
  });

  // ------------------------------------------------------------------
  // listProfiles – status filter & q search
  // ------------------------------------------------------------------
  describe('listProfiles', () => {
    it('passes status filter to find()', async () => {
      const findMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      userModel.find.mockReturnValue(findMock);

      await service.listProfiles({ status: 'pending' });

      expect(userModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' }),
      );
    });

    it('passes q search regex to find()', async () => {
      const findMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      userModel.find.mockReturnValue(findMock);

      await service.listProfiles({ q: 'alice' });

      const callArg = userModel.find.mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect(callArg.$or).toBeDefined();
    });
  });

  // ------------------------------------------------------------------
  // approve / reject / suspend / unsuspend
  // ------------------------------------------------------------------
  describe('approve', () => {
    it('sets status to active and clears rejectionReason', async () => {
      const doc = makeDoc({ status: 'pending', rejectionReason: 'too slow' });
      userModel.findById.mockResolvedValue(doc);

      const result = await service.approve(doc._id.toHexString());

      expect(doc.status).toBe('active');
      expect(doc.rejectionReason).toBeUndefined();
      expect(doc.save).toHaveBeenCalled();
      expect(result.status).toBe('active');
    });

    it('throws NotFoundException for unknown id', async () => {
      userModel.findById.mockResolvedValue(null);
      await expect(service.approve(makeId())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reject', () => {
    it('sets status to rejected with reason', async () => {
      const doc = makeDoc({ status: 'pending' });
      userModel.findById.mockResolvedValue(doc);
      userModel.countDocuments.mockResolvedValue(2);

      const result = await service.reject(doc._id.toHexString(), 'spam');

      expect(doc.status).toBe('rejected');
      expect(doc.rejectionReason).toBe('spam');
      expect(result.status).toBe('rejected');
    });

    it('throws BadRequestException when rejecting last admin', async () => {
      const doc = makeDoc({ role: 'admin' });
      userModel.findById.mockResolvedValue(doc);
      userModel.countDocuments.mockResolvedValue(1);

      await expect(service.reject(doc._id.toHexString())).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('suspend', () => {
    it('sets status to suspended', async () => {
      const doc = makeDoc({ status: 'active' });
      userModel.findById.mockResolvedValue(doc);
      userModel.countDocuments.mockResolvedValue(2);

      const result = await service.suspend(doc._id.toHexString(), 'abuse');

      expect(doc.status).toBe('suspended');
      expect(result.status).toBe('suspended');
    });
  });

  describe('unsuspend', () => {
    it('sets status back to active', async () => {
      const doc = makeDoc({ status: 'suspended' });
      userModel.findById.mockResolvedValue(doc);

      const result = await service.unsuspend(doc._id.toHexString());

      expect(doc.status).toBe('active');
      expect(result.status).toBe('active');
    });
  });

  // ------------------------------------------------------------------
  // invite
  // ------------------------------------------------------------------
  describe('invite', () => {
    it('creates user and returns tempPassword', async () => {
      userModel.findOne.mockResolvedValue(null);
      const doc = makeDoc({ role: 'user', status: 'active' });
      userModel.create.mockResolvedValue(doc);

      const result = await service.invite('Bob', 'bob@example.com', 'user');

      expect(result.tempPassword).toBeDefined();
      expect(result.tempPassword.length).toBeGreaterThan(8);
      expect(result.user.name).toBe('Alice');
    });

    it('throws ConflictException when email already taken', async () => {
      userModel.findOne.mockResolvedValue(makeDoc());

      await expect(
        service.invite('Bob', 'alice@example.com', 'user'),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ------------------------------------------------------------------
  // search – excludes private and self
  // ------------------------------------------------------------------
  describe('search', () => {
    it('returns empty array for empty results', async () => {
      const findMock = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      userModel.find.mockReturnValue(findMock);

      const result = await service.search('alice', makeId());
      expect(result).toEqual([]);
    });

    it('throws BadRequestException when q shorter than 2 chars', async () => {
      await expect(service.search('a', makeId())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('excludes requester from results', async () => {
      const findMock = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      userModel.find.mockReturnValue(findMock);

      const requesterId = makeId();
      await service.search('ali', requesterId);

      const filterArg = userModel.find.mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect(filterArg.isPublic).toBe(true);
      expect(filterArg.status).toBe('active');
      // requester should be excluded
      expect((filterArg._id as { $ne: Types.ObjectId }).$ne.toHexString()).toBe(
        requesterId,
      );
    });
  });

  // ------------------------------------------------------------------
  // updateMe
  // ------------------------------------------------------------------
  describe('updateMe', () => {
    it('updates name without requiring password', async () => {
      const doc = makeDoc();
      userModel.findById.mockResolvedValue(doc);

      const result = await service.updateMe(doc._id.toHexString(), {
        name: 'Alicia',
      });

      expect(doc.name).toBe('Alicia');
      expect(doc.save).toHaveBeenCalled();
      expect(result.name).toBe('Alicia');
    });

    it('throws UnauthorizedException when email change with wrong password', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      const doc = makeDoc({ password: hashed, email: 'alice@example.com' });
      userModel.findById.mockResolvedValue(doc);

      await expect(
        service.updateMe(doc._id.toHexString(), {
          email: 'new@example.com',
          currentPassword: 'wrong',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('updates email when correct password supplied', async () => {
      const hashed = await bcrypt.hash('secret', 10);
      const doc = makeDoc({ password: hashed, email: 'alice@example.com' });
      userModel.findById.mockResolvedValue(doc);
      userModel.findOne.mockResolvedValue(null); // email not taken

      await service.updateMe(doc._id.toHexString(), {
        email: 'new@example.com',
        currentPassword: 'secret',
      });

      expect(doc.email).toBe('new@example.com');
    });

    it('throws ConflictException when new email already taken', async () => {
      const hashed = await bcrypt.hash('secret', 10);
      const doc = makeDoc({ password: hashed, email: 'alice@example.com' });
      userModel.findById.mockResolvedValue(doc);
      userModel.findOne.mockResolvedValue(
        makeDoc({ email: 'new@example.com' }),
      );

      await expect(
        service.updateMe(doc._id.toHexString(), {
          email: 'new@example.com',
          currentPassword: 'secret',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ------------------------------------------------------------------
  // changePassword
  // ------------------------------------------------------------------
  describe('changePassword', () => {
    it('throws UnauthorizedException when current password is wrong', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      const doc = makeDoc({ password: hashed });
      userModel.findById.mockResolvedValue(doc);

      await expect(
        service.changePassword(doc._id.toHexString(), 'wrong', 'newpass123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('hashes and saves new password when current is correct', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      const doc = makeDoc({ password: hashed });
      userModel.findById.mockResolvedValue(doc);

      await service.changePassword(
        doc._id.toHexString(),
        'correct',
        'newpass123',
      );

      expect(doc.save).toHaveBeenCalled();
      // new password should be a bcrypt hash of 'newpass123'
      const matches = await bcrypt.compare(
        'newpass123',
        doc.password as string,
      );
      expect(matches).toBe(true);
    });
  });
});
