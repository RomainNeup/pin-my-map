import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { SavedPlaceService } from './saved.service';
import { PlaceService } from 'src/place/place.service';
import { TagService } from 'src/tag/tag.service';
import { GamificationService } from 'src/gamification/gamification.service';

const SAVED_TOKEN = getModelToken('SavedPlace');
const TAG_TOKEN = getModelToken('Tag');

const makeOid = (hex?: string) =>
  new Types.ObjectId(hex ?? '000000000000000000000001');

function makeSavedPlace(opts: {
  id?: Types.ObjectId;
  placeName: string;
  tagIds?: Types.ObjectId[];
  tagNames?: string[];
}) {
  const id = opts.id ?? makeOid();
  const tagIds = opts.tagIds ?? [];
  const tagNames = opts.tagNames ?? [];
  const tags = tagIds.map((tid, i) => ({
    _id: tid,
    name: tagNames[i] ?? '',
  }));
  return {
    _id: { toHexString: () => id.toHexString() },
    place: {
      _id: makeOid(),
      name: opts.placeName,
      location: [2, 48],
      address: 'Paris, France',
    },
    tags,
    done: false,
    comment: '',
    createdAt: new Date(),
  };
}

const buildService = async (opts: {
  savedPlaces: unknown[];
  matchingTags?: Array<{ _id: Types.ObjectId }>;
}) => {
  const { savedPlaces, matchingTags = [] } = opts;

  const tagModel = {
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(matchingTags),
    }),
  };

  const savedPlaceModel = {
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(savedPlaces),
    }),
  };

  const mod = await Test.createTestingModule({
    providers: [
      SavedPlaceService,
      { provide: SAVED_TOKEN, useValue: savedPlaceModel },
      { provide: TAG_TOKEN, useValue: tagModel },
      { provide: PlaceService, useValue: {} },
      { provide: TagService, useValue: {} },
      { provide: GamificationService, useValue: { award: jest.fn() } },
    ],
  }).compile();

  return {
    service: mod.get(SavedPlaceService),
    savedPlaceModel,
    tagModel,
  };
};

describe('SavedPlaceService.search', () => {
  const userId = 'aaaaaaaaaaaaaaaaaaaaaaaa';

  it('returns saved places matching by place name (case-insensitive)', async () => {
    const sp = makeSavedPlace({ placeName: 'Cafe de Flore' });
    const { service } = await buildService({ savedPlaces: [sp] });

    // Mock the mapper
    jest
      .spyOn((await import('./saved.mapper')).SavedPlaceMapper, 'toDto')
      .mockImplementation(
        (s: unknown) => ({ id: (s as typeof sp)._id.toHexString() }) as never,
      );

    const results = await service.search(userId, 'cafe');
    expect(results).toHaveLength(1);
  });

  it('returns saved places matching by tag name', async () => {
    const tagId = makeOid('bbbbbbbbbbbbbbbbbbbbbbbb');
    const sp = makeSavedPlace({
      placeName: 'Unrelated Place',
      tagIds: [tagId],
      tagNames: ['restaurant'],
    });
    const { service } = await buildService({
      savedPlaces: [sp],
      matchingTags: [{ _id: tagId }],
    });

    jest
      .spyOn((await import('./saved.mapper')).SavedPlaceMapper, 'toDto')
      .mockImplementation(
        (s: unknown) => ({ id: (s as typeof sp)._id.toHexString() }) as never,
      );

    const results = await service.search(userId, 'restaurant');
    expect(results).toHaveLength(1);
  });

  it('returns a place matching both place name and tag (deduped)', async () => {
    const tagId = makeOid('cccccccccccccccccccccccc');
    const sp = makeSavedPlace({
      placeName: 'Cafe Restaurant',
      tagIds: [tagId],
      tagNames: ['cafe'],
    });
    const { service } = await buildService({
      savedPlaces: [sp],
      matchingTags: [{ _id: tagId }],
    });

    jest
      .spyOn((await import('./saved.mapper')).SavedPlaceMapper, 'toDto')
      .mockImplementation(
        (s: unknown) => ({ id: (s as typeof sp)._id.toHexString() }) as never,
      );

    const results = await service.search(userId, 'cafe');
    expect(results).toHaveLength(1);
  });

  it('returns empty array when nothing matches', async () => {
    const sp = makeSavedPlace({ placeName: 'Library' });
    const { service } = await buildService({ savedPlaces: [sp] });

    jest
      .spyOn((await import('./saved.mapper')).SavedPlaceMapper, 'toDto')
      .mockReturnValue({} as never);

    const results = await service.search(userId, 'xyz-not-found');
    expect(results).toHaveLength(0);
  });

  it('limits results to 30', async () => {
    const manyPlaces = Array.from({ length: 50 }, (_, i) =>
      makeSavedPlace({ placeName: `Cafe ${i}` }),
    );
    const { service } = await buildService({ savedPlaces: manyPlaces });

    jest
      .spyOn((await import('./saved.mapper')).SavedPlaceMapper, 'toDto')
      .mockImplementation((s: unknown) => {
        const sp = s as ReturnType<typeof makeSavedPlace>;
        return { id: sp._id.toHexString() } as never;
      });

    const results = await service.search(userId, 'cafe');
    expect(results.length).toBeLessThanOrEqual(30);
  });

  it('searches are case-insensitive for place names', async () => {
    const sp = makeSavedPlace({ placeName: 'BRASSERIE DU NORD' });
    const { service } = await buildService({ savedPlaces: [sp] });

    jest
      .spyOn((await import('./saved.mapper')).SavedPlaceMapper, 'toDto')
      .mockImplementation(
        (s: unknown) => ({ id: (s as typeof sp)._id.toHexString() }) as never,
      );

    const results = await service.search(userId, 'brasserie');
    expect(results).toHaveLength(1);
  });
});
