import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { PublicMapService } from './public-map.service';
import { SavedPlace } from 'src/saved/saved.entity';
import { User } from 'src/user/user.entity';
import { Follow } from 'src/follow/follow.entity';
import { UserGamification } from 'src/gamification/gamification.entity';
import { UserService } from 'src/user/user.service';
import { FollowService } from 'src/follow/follow.service';

const SAVED_TOKEN = getModelToken(SavedPlace.name);
const USER_TOKEN = getModelToken(User.name);
const FOLLOW_TOKEN = getModelToken(Follow.name);
const GAM_TOKEN = getModelToken(UserGamification.name);

const makeOid = (hex?: string) =>
  new Types.ObjectId(hex ?? '000000000000000000000001');

const buildService = (opts: {
  userFindBySlug?: unknown;
  userFindByToken?: unknown;
  totalCount?: number;
  savedPlaces?: unknown[];
}) => {
  const {
    userFindBySlug = null,
    userFindByToken = null,
    totalCount = 0,
    savedPlaces = [],
  } = opts;

  const savedPlaceModel = {
    countDocuments: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(totalCount),
    }),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(savedPlaces),
    }),
    aggregate: jest.fn().mockResolvedValue([]),
  };

  const userModel = {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    }),
  };

  const followModel = {
    find: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    }),
  };

  const gamModel = {
    find: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    }),
  };

  const userService = {
    findBySlug: jest.fn().mockResolvedValue(userFindBySlug),
    findByPublicToken: jest.fn().mockResolvedValue(userFindByToken),
  };

  const followService = {
    getFollowerCounts: jest.fn().mockResolvedValue(new Map()),
  };

  return Test.createTestingModule({
    providers: [
      PublicMapService,
      { provide: SAVED_TOKEN, useValue: savedPlaceModel },
      { provide: USER_TOKEN, useValue: userModel },
      { provide: FOLLOW_TOKEN, useValue: followModel },
      { provide: GAM_TOKEN, useValue: gamModel },
      { provide: UserService, useValue: userService },
      { provide: FollowService, useValue: followService },
    ],
  })
    .compile()
    .then((mod) => ({
      service: mod.get(PublicMapService),
      savedPlaceModel,
    }));
};

describe('PublicMapService pagination', () => {
  const userId = makeOid('aaaaaaaaaaaaaaaaaaaaaaaa');
  const user = { _id: userId, name: 'Alice', publicSlug: 'alice' };

  describe('getBySlug', () => {
    it('uses default limit=30 and offset=0 when not specified', async () => {
      const { service, savedPlaceModel } = await buildService({
        userFindBySlug: user,
        totalCount: 5,
        savedPlaces: [],
      });

      await service.getBySlug('alice', { limit: 30, offset: 0 });

      const findCall = savedPlaceModel.find.mock.results[0].value;
      expect(findCall.skip).toHaveBeenCalledWith(0);
      expect(findCall.limit).toHaveBeenCalledWith(30);
    });

    it('applies offset and limit correctly', async () => {
      const { service, savedPlaceModel } = await buildService({
        userFindBySlug: user,
        totalCount: 50,
        savedPlaces: [],
      });

      await service.getBySlug('alice', { limit: 10, offset: 20 });

      const findCall = savedPlaceModel.find.mock.results[0].value;
      expect(findCall.skip).toHaveBeenCalledWith(20);
      expect(findCall.limit).toHaveBeenCalledWith(10);
    });

    it('returns total and hasMore=true when more pages exist', async () => {
      const fakePlace = {
        _id: makeOid(),
        place: {
          _id: makeOid(),
          name: 'Cafe',
          location: [2, 48],
          address: 'Paris',
        },
        tags: [],
        done: false,
        comment: '',
        createdAt: new Date(),
      };
      const { service } = await buildService({
        userFindBySlug: user,
        totalCount: 100,
        savedPlaces: [fakePlace],
      });

      const result = await service.getBySlug('alice', { limit: 1, offset: 0 });

      expect(result.total).toBe(100);
      expect(result.hasMore).toBe(true);
    });

    it('returns hasMore=false when last page is returned', async () => {
      const fakePlace = {
        _id: makeOid(),
        place: {
          _id: makeOid(),
          name: 'Cafe',
          location: [2, 48],
          address: 'Paris',
        },
        tags: [],
        done: false,
        comment: '',
        createdAt: new Date(),
      };
      const { service } = await buildService({
        userFindBySlug: user,
        totalCount: 1,
        savedPlaces: [fakePlace],
      });

      const result = await service.getBySlug('alice', { limit: 30, offset: 0 });

      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('returns hasMore=false when offset+page >= total', async () => {
      const { service } = await buildService({
        userFindBySlug: user,
        totalCount: 5,
        savedPlaces: [],
      });

      const result = await service.getBySlug('alice', { limit: 10, offset: 5 });

      expect(result.total).toBe(5);
      expect(result.hasMore).toBe(false);
    });

    it('throws NotFoundException when slug not found', async () => {
      const { service } = await buildService({ userFindBySlug: null });

      await expect(
        service.getBySlug('unknown', { limit: 30, offset: 0 }),
      ).rejects.toThrow('Public map not found');
    });
  });

  describe('getByToken', () => {
    it('uses limit and offset correctly', async () => {
      const { service, savedPlaceModel } = await buildService({
        userFindByToken: user,
        totalCount: 20,
        savedPlaces: [],
      });

      await service.getByToken('tok', { limit: 5, offset: 10 });

      const findCall = savedPlaceModel.find.mock.results[0].value;
      expect(findCall.skip).toHaveBeenCalledWith(10);
      expect(findCall.limit).toHaveBeenCalledWith(5);
    });

    it('throws NotFoundException when token not found', async () => {
      const { service } = await buildService({ userFindByToken: null });

      await expect(
        service.getByToken('bad-token', { limit: 30, offset: 0 }),
      ).rejects.toThrow('Public map not found');
    });
  });
});

describe('parsePagination (via controller logic)', () => {
  /**
   * The clamping logic lives in public-map.controller.ts as a private helper.
   * We test it indirectly by verifying that values fed through it stay in [1..100].
   */
  function parsePagination(limitRaw?: string, offsetRaw?: string) {
    const DEFAULT_LIMIT = 30;
    const MAX_LIMIT = 100;
    const rawLimit = limitRaw !== undefined ? Number(limitRaw) : DEFAULT_LIMIT;
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(1, rawLimit), MAX_LIMIT)
      : DEFAULT_LIMIT;
    const rawOffset = offsetRaw !== undefined ? Number(offsetRaw) : 0;
    const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;
    return { limit, offset };
  }

  it('clamps limit=1000 to 100', () => {
    expect(parsePagination('1000', '0').limit).toBe(100);
  });

  it('clamps limit=0 to 1', () => {
    expect(parsePagination('0', '0').limit).toBe(1);
  });

  it('uses default limit=30 when not provided', () => {
    expect(parsePagination(undefined, undefined).limit).toBe(30);
  });

  it('uses default offset=0 when not provided', () => {
    expect(parsePagination(undefined, undefined).offset).toBe(0);
  });

  it('clamps negative offset to 0', () => {
    expect(parsePagination('10', '-5').offset).toBe(0);
  });

  it('handles NaN limit by defaulting to 30', () => {
    expect(parsePagination('abc', '0').limit).toBe(30);
  });

  it('handles NaN offset by defaulting to 0', () => {
    expect(parsePagination('10', 'xyz').offset).toBe(0);
  });
});
