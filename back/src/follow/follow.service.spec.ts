import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { GamificationService } from 'src/gamification/gamification.service';
import { User } from 'src/user/user.entity';
import { Follow } from './follow.entity';
import { FollowService } from './follow.service';

const FOLLOW_TOKEN = getModelToken(Follow.name);
const USER_TOKEN = getModelToken(User.name);

const uid1 = new Types.ObjectId().toString();
const uid2 = new Types.ObjectId().toString();

const buildService = (opts: {
  followExists?: boolean;
  userExists?: boolean;
  awardFn?: jest.Mock;
}) => {
  const { followExists = false, userExists = true, awardFn } = opts;

  const followModel = {
    findOne: jest.fn().mockResolvedValue(followExists ? { _id: 'x' } : null),
    exists: jest.fn().mockResolvedValue(followExists ? { _id: 'x' } : null),
    create: jest.fn().mockResolvedValue({}),
    countDocuments: jest.fn().mockResolvedValue(0),
    deleteOne: jest.fn().mockResolvedValue({}),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        populate: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
      }),
    }),
    aggregate: jest.fn().mockResolvedValue([]),
  };

  const userModel = {
    findById: jest
      .fn()
      .mockResolvedValue(userExists ? { _id: uid2, name: 'Bob' } : null),
  };

  const gamificationService = {
    award:
      awardFn ??
      jest.fn().mockResolvedValue({ awardedPoints: 5, newlyUnlocked: [] }),
  };

  return Test.createTestingModule({
    providers: [
      FollowService,
      { provide: FOLLOW_TOKEN, useValue: followModel },
      { provide: USER_TOKEN, useValue: userModel },
      { provide: GamificationService, useValue: gamificationService },
    ],
  })
    .compile()
    .then((m) => ({
      service: m.get(FollowService),
      followModel,
      gamificationService,
    }));
};

describe('FollowService.isFollowing', () => {
  it('returns { following: true } when a follow record exists', async () => {
    const { service } = await buildService({ followExists: true });
    const result = await service.isFollowing(uid1, uid2);
    expect(result).toEqual({ following: true });
  });

  it('returns { following: false } when no follow record exists', async () => {
    const { service } = await buildService({ followExists: false });
    const result = await service.isFollowing(uid1, uid2);
    expect(result).toEqual({ following: false });
  });

  it('throws BadRequestException for an invalid target userId', async () => {
    const { service } = await buildService({});
    await expect(service.isFollowing(uid1, 'not-an-object-id')).rejects.toThrow(
      BadRequestException,
    );
  });
});

describe('FollowService.follow — gamification', () => {
  it('awards gamification on first follow', async () => {
    const awardFn = jest
      .fn()
      .mockResolvedValue({ awardedPoints: 5, newlyUnlocked: [] });
    const { service } = await buildService({ followExists: false, awardFn });

    await service.follow(uid1, uid2);

    expect(awardFn).toHaveBeenCalledTimes(1);
    expect(awardFn).toHaveBeenCalledWith(uid1, 'follow');
  });

  it('does not award gamification when already following', async () => {
    const awardFn = jest
      .fn()
      .mockResolvedValue({ awardedPoints: 5, newlyUnlocked: [] });
    const { service } = await buildService({ followExists: true, awardFn });

    await service.follow(uid1, uid2);

    expect(awardFn).not.toHaveBeenCalled();
  });

  it('does not throw when gamification award fails', async () => {
    const awardFn = jest.fn().mockRejectedValue(new Error('gami down'));
    const { service } = await buildService({ followExists: false, awardFn });

    // should resolve normally despite gamification failure
    await expect(service.follow(uid1, uid2)).resolves.toBeDefined();
  });
});
