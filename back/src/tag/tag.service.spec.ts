import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { GamificationService } from 'src/gamification/gamification.service';
import { TagService } from './tag.service';

const TAG_TOKEN = getModelToken('Tag');
const SAVED_TOKEN = getModelToken('SavedPlace');

interface TagDoc {
  _id: { toHexString: () => string };
  name: string;
  emoji: string;
  color?: string;
  owner: string;
}

const buildTagDoc = (overrides: Partial<TagDoc> = {}): TagDoc => ({
  _id: { toHexString: () => 'tag-1' },
  name: 'Coffee',
  emoji: '☕',
  owner: 'user-1',
  ...overrides,
});

const buildService = async (
  opts: {
    findOneResult?: TagDoc | null;
    countResult?: number;
  } = {},
) => {
  const findOneExec = jest.fn().mockResolvedValue(opts.findOneResult ?? null);
  const findOneAndUpdateExec = jest
    .fn()
    .mockResolvedValue(opts.findOneResult ?? null);
  const findOneAndDeleteExec = jest.fn().mockResolvedValue(null);
  const findExec = jest.fn().mockResolvedValue([]);
  const countDocumentsExec = jest.fn().mockResolvedValue(opts.countResult ?? 0);

  const savedDoc = jest.fn();
  function MockTagModel(this: TagDoc, doc: Partial<TagDoc>) {
    Object.assign(this, doc);
    this._id = { toHexString: () => 'tag-1' };
    // @ts-expect-error attach save
    this.save = savedDoc.mockResolvedValue({
      _id: { toHexString: () => 'tag-1' },
      name: doc.name,
      emoji: doc.emoji,
      color: doc.color,
      owner: doc.owner,
    });
  }
  (MockTagModel as unknown as Record<string, unknown>).findOne = jest
    .fn()
    .mockReturnValue({ exec: findOneExec });
  (MockTagModel as unknown as Record<string, unknown>).find = jest
    .fn()
    .mockReturnValue({ exec: findExec });
  (MockTagModel as unknown as Record<string, unknown>).findOneAndUpdate = jest
    .fn()
    .mockReturnValue({ exec: findOneAndUpdateExec });
  (MockTagModel as unknown as Record<string, unknown>).findOneAndDelete = jest
    .fn()
    .mockReturnValue({ exec: findOneAndDeleteExec });
  (MockTagModel as unknown as Record<string, unknown>).countDocuments = jest
    .fn()
    .mockReturnValue({ exec: countDocumentsExec });

  const savedPlaceModel = {
    updateMany: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(undefined) }),
  };

  const gamificationService = {
    award: jest.fn().mockResolvedValue({
      awardedPoints: 2,
      newlyUnlocked: [],
    }),
  };

  const mod = await Test.createTestingModule({
    providers: [
      TagService,
      { provide: TAG_TOKEN, useValue: MockTagModel },
      { provide: SAVED_TOKEN, useValue: savedPlaceModel },
      { provide: GamificationService, useValue: gamificationService },
    ],
  }).compile();

  return {
    service: mod.get(TagService),
    tagModel: MockTagModel as unknown as Record<string, jest.Mock>,
    gamificationService,
  };
};

describe('TagService', () => {
  const userId = 'user-1';

  describe('create', () => {
    it('rejects with 409 when a tag with the same name already exists for the owner', async () => {
      const { service, tagModel, gamificationService } = await buildService({
        findOneResult: buildTagDoc({ name: 'Coffee' }),
      });

      await expect(
        service.create(userId, { name: 'Coffee', emoji: '☕' }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(tagModel.findOne).toHaveBeenCalledWith({
        owner: userId,
        name: 'Coffee',
      });
      expect(gamificationService.award).not.toHaveBeenCalled();
    });

    it('persists and returns the color when valid', async () => {
      const { service } = await buildService({ countResult: 0 });

      const result = await service.create(userId, {
        name: 'Coffee',
        emoji: '☕',
        color: '#abcdef',
      });

      expect(result).toEqual({
        id: 'tag-1',
        name: 'Coffee',
        emoji: '☕',
        color: '#abcdef',
      });
    });

    it('returns the tag without a color when not supplied', async () => {
      const { service } = await buildService({ countResult: 1 });

      const result = await service.create(userId, {
        name: 'Coffee',
        emoji: '☕',
      });

      expect(result.color).toBeUndefined();
    });

    it('awards gamification on the very first tag a user creates', async () => {
      const { service, gamificationService } = await buildService({
        countResult: 0,
      });

      await service.create(userId, { name: 'Coffee', emoji: '☕' });

      expect(gamificationService.award).toHaveBeenCalledTimes(1);
      expect(gamificationService.award).toHaveBeenCalledWith(userId, 'tag');
    });

    it('does not award gamification on subsequent tag creations', async () => {
      const { service, gamificationService } = await buildService({
        countResult: 3,
      });

      await service.create(userId, { name: 'Coffee', emoji: '☕' });

      expect(gamificationService.award).not.toHaveBeenCalled();
    });

    it('does not let a gamification failure abort tag creation', async () => {
      const { service, gamificationService } = await buildService({
        countResult: 0,
      });
      gamificationService.award.mockRejectedValueOnce(new Error('boom'));

      await expect(
        service.create(userId, { name: 'Coffee', emoji: '☕' }),
      ).resolves.toMatchObject({ id: 'tag-1', name: 'Coffee' });
    });
  });

  describe('update', () => {
    it('rejects with 409 when another tag with the same name already exists', async () => {
      const { service } = await buildService({
        findOneResult: buildTagDoc({
          _id: { toHexString: () => 'other-tag' },
          name: 'Coffee',
        }),
      });

      await expect(
        service.update(userId, 'tag-1', { name: 'Coffee', emoji: '☕' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws NotFound when the tag does not belong to the user', async () => {
      const { service } = await buildService({ findOneResult: null });

      await expect(
        service.update(userId, 'tag-1', { name: 'Coffee', emoji: '☕' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
