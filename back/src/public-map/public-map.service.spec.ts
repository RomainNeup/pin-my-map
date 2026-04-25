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
  users?: unknown[];
  savedAgg?: unknown[];
  gamRecords?: unknown[];
  followRows?: unknown[];
  userFindBySlug?: unknown;
  savedCount?: number;
  doneCount?: number;
  tagAgg?: unknown[];
}) => {
  const {
    users = [],
    savedAgg = [],
    gamRecords = [],
    followRows = [],
    userFindBySlug = null,
    savedCount = 0,
    doneCount = 0,
    tagAgg = [],
  } = opts;

  const userModel = {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(users),
    }),
  };

  const savedPlaceModel = {
    aggregate: jest.fn().mockImplementation((pipeline: unknown[]) => {
      const stages = pipeline as Array<Record<string, unknown>>;
      const hasUnwind = stages.some((s) => '$unwind' in s);
      if (hasUnwind) {
        return Promise.resolve(tagAgg);
      }
      return Promise.resolve(savedAgg);
    }),
    countDocuments: jest
      .fn()
      .mockImplementation((filter: Record<string, unknown>) => ({
        exec: jest
          .fn()
          .mockResolvedValue(filter?.done === true ? doneCount : savedCount),
      })),
  };

  const followModel = {
    find: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(followRows),
    }),
  };

  const gamModel = {
    find: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(gamRecords),
    }),
  };

  const userService = {
    findBySlug: jest.fn().mockResolvedValue(userFindBySlug),
    findByPublicToken: jest.fn().mockResolvedValue(null),
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
      userModel,
      savedPlaceModel,
      followModel,
      gamModel,
      userService,
      followService,
    }));
};

describe('PublicMapService', () => {
  describe('discover', () => {
    it('returns points=0 and level=1 when user has no gamification record', async () => {
      const userId = makeOid();
      const { service } = await buildService({
        users: [
          { _id: userId, name: 'Alice', publicSlug: 'alice', isPublic: true },
        ],
        savedAgg: [],
        gamRecords: [],
      });

      const results = await service.discover();

      expect(results).toHaveLength(1);
      expect(results[0].points).toBe(0);
      expect(results[0].level).toBe(1);
    });

    it('computes level from gamification points', async () => {
      const userId = makeOid();
      // level = floor(sqrt(points/50)) + 1
      // points=200 → floor(sqrt(4))+1 = 3
      const { service } = await buildService({
        users: [
          { _id: userId, name: 'Bob', publicSlug: 'bob', isPublic: true },
        ],
        gamRecords: [{ user: userId, points: 200 }],
      });

      const results = await service.discover();

      expect(results[0].points).toBe(200);
      expect(results[0].level).toBe(3);
    });

    it('includes savedCount and followerCount', async () => {
      const userId = makeOid();
      const { service, followService } = await buildService({
        users: [
          { _id: userId, name: 'Carol', publicSlug: 'carol', isPublic: true },
        ],
        savedAgg: [{ _id: userId, count: 5 }],
        gamRecords: [],
      });
      followService.getFollowerCounts.mockResolvedValue(
        new Map([[userId.toString(), 3]]),
      );

      const results = await service.discover();

      expect(results[0].savedCount).toBe(5);
      expect(results[0].followerCount).toBe(3);
    });
  });

  describe('getFollowingPublicMaps', () => {
    it('returns empty array when requester follows nobody', async () => {
      const requesterId = makeOid('aaaaaaaaaaaaaaaaaaaaaaaa');
      const { service } = await buildService({ followRows: [] });

      const results = await service.getFollowingPublicMaps(
        requesterId.toString(),
      );

      expect(results).toEqual([]);
    });

    it('only returns users whose map is public', async () => {
      const requesterId = makeOid('aaaaaaaaaaaaaaaaaaaaaaaa');
      const publicUserId = makeOid('bbbbbbbbbbbbbbbbbbbbbbbb');
      const privateUserId = makeOid('cccccccccccccccccccccccc');

      const followRows = [
        { follower: requesterId, followed: publicUserId },
        { follower: requesterId, followed: privateUserId },
      ];

      const { service, userModel } = await buildService({
        followRows,
        gamRecords: [],
      });

      // userModel.find returns only public users (simulates DB filtering isPublic:true)
      userModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          {
            _id: publicUserId,
            name: 'Public User',
            publicSlug: 'pub',
            isPublic: true,
          },
        ]),
      });

      const results = await service.getFollowingPublicMaps(
        requesterId.toString(),
      );

      expect(results).toHaveLength(1);
      expect(results[0].userId).toBe(publicUserId.toString());
    });

    it('excludes the requester even if self-followed', async () => {
      const requesterId = makeOid('aaaaaaaaaaaaaaaaaaaaaaaa');

      // Self-follow: followed === requester (service filters this out before DB query)
      const followRows = [{ follower: requesterId, followed: requesterId }];

      const { service, userModel } = await buildService({
        followRows,
        gamRecords: [],
      });

      const results = await service.getFollowingPublicMaps(
        requesterId.toString(),
      );

      expect(results).toEqual([]);
      // userModel.find should NOT be called because followedIds is empty after filtering
      expect(userModel.find).not.toHaveBeenCalled();
    });
  });

  describe('getStatsBySlug', () => {
    it('throws NotFoundException when slug not found', async () => {
      const { service } = await buildService({ userFindBySlug: null });

      await expect(service.getStatsBySlug('unknown')).rejects.toThrow(
        'Public map not found',
      );
    });

    it('returns correct savedCount, doneCount and tagCount', async () => {
      const userId = makeOid();
      const { service, savedPlaceModel } = await buildService({
        userFindBySlug: { _id: userId, name: 'Alice', publicSlug: 'alice' },
        tagAgg: [{ _id: null, tags: [makeOid(), makeOid(), makeOid()] }],
      });

      savedPlaceModel.countDocuments
        .mockImplementationOnce(() => ({
          exec: jest.fn().mockResolvedValue(10),
        }))
        .mockImplementationOnce(() => ({
          exec: jest.fn().mockResolvedValue(4),
        }));

      const stats = await service.getStatsBySlug('alice');

      expect(stats.savedCount).toBe(10);
      expect(stats.doneCount).toBe(4);
      expect(stats.tagCount).toBe(3);
    });

    it('returns tagCount=0 when user has no tagged saved places', async () => {
      const userId = makeOid();
      const { service, savedPlaceModel } = await buildService({
        userFindBySlug: { _id: userId, name: 'Bob', publicSlug: 'bob' },
        tagAgg: [],
      });

      savedPlaceModel.countDocuments
        .mockImplementationOnce(() => ({
          exec: jest.fn().mockResolvedValue(0),
        }))
        .mockImplementationOnce(() => ({
          exec: jest.fn().mockResolvedValue(0),
        }));

      const stats = await service.getStatsBySlug('bob');

      expect(stats.tagCount).toBe(0);
    });
  });
});
