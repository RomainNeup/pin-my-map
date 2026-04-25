import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ImportService, extractLeadingEmoji } from './import.service';
import { GamificationService } from 'src/gamification/gamification.service';

const PLACE_TOKEN = getModelToken('Place');
const TAG_TOKEN = getModelToken('Tag');
const SAVED_TOKEN = getModelToken('SavedPlace');

const mockGamificationService = {
  recompute: jest.fn().mockResolvedValue(undefined),
};

describe('extractLeadingEmoji', () => {
  it('splits a leading simple emoji', () => {
    expect(extractLeadingEmoji('🍺 Beer')).toEqual({
      name: 'Beer',
      emoji: '🍺',
    });
  });

  it('splits a leading flag (regional indicators)', () => {
    expect(extractLeadingEmoji('🇯🇵 Japonais')).toEqual({
      name: 'Japonais',
      emoji: '🇯🇵',
    });
  });

  it('defaults the emoji when name has no leading emoji', () => {
    expect(extractLeadingEmoji('Restaurant')).toEqual({
      name: 'Restaurant',
      emoji: '📍',
    });
  });

  it('trims surrounding whitespace', () => {
    expect(extractLeadingEmoji('  🍣 Sushi  ')).toEqual({
      name: 'Sushi',
      emoji: '🍣',
    });
  });
});

describe('ImportService', () => {
  const userId = 'user-1';

  const buildFeature = (overrides: Record<string, unknown> = {}) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [2.35, 48.85] },
    properties: {
      name: 'Test Place',
      address: '1 Test St',
      tags: [{ name: '🍺 Beer' }],
      userComment: 'nice',
      ...overrides,
    },
  });

  const buildService = (
    opts: {
      placeFindOne?: unknown;
      alreadySaved?: boolean;
    } = {},
  ) => {
    const placeModel = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(opts.placeFindOne ?? null),
      }),
      create: jest
        .fn()
        .mockResolvedValue({ _id: 'place-1', name: 'Test Place' }),
    };
    const tagModel = {
      find: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
      create: jest
        .fn()
        .mockResolvedValue({ _id: 'tag-1', name: 'Beer', emoji: '🍺' }),
    };
    const savedPlaceModel = {
      exists: jest.fn().mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue(opts.alreadySaved ? { _id: 'sp-1' } : null),
      }),
      create: jest.fn().mockResolvedValue({ _id: 'sp-1' }),
    };

    return Test.createTestingModule({
      providers: [
        ImportService,
        { provide: PLACE_TOKEN, useValue: placeModel },
        { provide: TAG_TOKEN, useValue: tagModel },
        { provide: SAVED_TOKEN, useValue: savedPlaceModel },
        { provide: GamificationService, useValue: mockGamificationService },
      ],
    })
      .compile()
      .then((mod) => ({
        service: mod.get(ImportService),
        placeModel,
        tagModel,
        savedPlaceModel,
      }));
  };

  it('rejects non-FeatureCollection payloads', async () => {
    const { service } = await buildService();
    await expect(
      service.importMapstr(userId, { type: 'nope' }),
    ).rejects.toThrow('FeatureCollection');
  });

  it('imports a new feature, creating place, tag and saved place', async () => {
    const { service, placeModel, tagModel, savedPlaceModel } =
      await buildService();
    const result = await service.importMapstr(userId, {
      type: 'FeatureCollection',
      features: [buildFeature()],
    });

    expect(result).toEqual({ imported: 1, skipped: 0, failed: 0, errors: [] });
    expect(placeModel.create).toHaveBeenCalledTimes(1);
    expect(tagModel.create).toHaveBeenCalledWith({
      owner: userId,
      name: 'Beer',
      emoji: '🍺',
    });
    expect(savedPlaceModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user: userId,
        place: 'place-1',
        tags: ['tag-1'],
        comment: 'nice',
      }),
    );
  });

  it('skips a feature already saved by the user', async () => {
    const { service, savedPlaceModel } = await buildService({
      placeFindOne: { _id: 'place-1' },
      alreadySaved: true,
    });
    const result = await service.importMapstr(userId, {
      type: 'FeatureCollection',
      features: [buildFeature()],
    });

    expect(result).toEqual({ imported: 0, skipped: 1, failed: 0, errors: [] });
    expect(savedPlaceModel.create).not.toHaveBeenCalled();
  });

  it('collects per-feature errors without aborting', async () => {
    const { service } = await buildService();
    const result = await service.importMapstr(userId, {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [] },
          properties: { name: 'bad' },
        },
        buildFeature({ name: 'good' }),
      ],
    });

    expect(result.imported).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors[0]).toMatchObject({ index: 0, name: 'bad' });
  });
});
