import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { GamificationService } from 'src/gamification/gamification.service';
import { AuditService } from 'src/audit/audit.service';
import { ImportService, extractLeadingEmoji } from './import.service';

const PLACE_TOKEN = getModelToken('Place');
const TAG_TOKEN = getModelToken('Tag');
const SAVED_TOKEN = getModelToken('SavedPlace');

// ── extractLeadingEmoji ───────────────────────────────────────────────────────

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

// ── Shared builder ────────────────────────────────────────────────────────────

const gamificationMock = {
  recompute: jest.fn().mockResolvedValue(undefined),
  award: jest.fn().mockResolvedValue({ awardedPoints: 10, newlyUnlocked: [] }),
};

const auditMock = {
  log: jest.fn().mockResolvedValue(undefined),
};

const buildService = async (
  opts: {
    placeFindOne?: unknown;
    alreadySaved?: boolean;
    placeCreate?: unknown;
  } = {},
) => {
  const placeModel = {
    findOne: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(opts.placeFindOne ?? null),
    }),
    create: jest
      .fn()
      .mockResolvedValue(
        opts.placeCreate ?? { _id: 'place-1', name: 'Test Place' },
      ),
  };
  const tagModel = {
    find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
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

  const module = await Test.createTestingModule({
    providers: [
      ImportService,
      { provide: PLACE_TOKEN, useValue: placeModel },
      { provide: TAG_TOKEN, useValue: tagModel },
      { provide: SAVED_TOKEN, useValue: savedPlaceModel },
      { provide: GamificationService, useValue: gamificationMock },
      { provide: AuditService, useValue: auditMock },
    ],
  }).compile();

  return {
    service: module.get(ImportService),
    placeModel,
    tagModel,
    savedPlaceModel,
  };
};

// ── ImportService.importMapstr ────────────────────────────────────────────────

describe('ImportService.importMapstr', () => {
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

// ── ImportService.importPlacesCsv (TAS-11) ────────────────────────────────────

describe('ImportService.importPlacesCsv', () => {
  const adminId = 'admin-1';

  const csvBuffer = (content: string) => Buffer.from(content, 'utf-8');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('happy path: creates places for all valid rows', async () => {
    const { service, placeModel } = await buildService();
    const csv = [
      'name,lat,lng,address,description,image',
      'Cafe A,48.85,2.35,1 Rue de Rivoli,Nice spot,https://img.example.com/a.jpg',
      'Cafe B,48.86,2.36,2 Rue de Rivoli,,',
    ].join('\n');
    const result = await service.importPlacesCsv(adminId, csvBuffer(csv));

    expect(result.created).toBe(2);
    expect(result.errors).toHaveLength(0);
    expect(placeModel.create).toHaveBeenCalledTimes(2);
    expect(placeModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Cafe A',
        moderationStatus: 'approved',
        createdBy: adminId,
      }),
    );
  });

  it('collects error rows without aborting the rest', async () => {
    const { service, placeModel } = await buildService();
    const csv = [
      'name,lat,lng,address',
      'Good Place,48.85,2.35,Some Street',
      'Bad Place,999,2.35,Some Street',
      'Another Good,48.86,2.36,Other Street',
    ].join('\n');
    const result = await service.importPlacesCsv(adminId, csvBuffer(csv));

    expect(result.created).toBe(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      row: 2,
      message: expect.stringContaining('lat'),
    });
    expect(placeModel.create).toHaveBeenCalledTimes(2);
  });

  it('throws BadRequestException when required header columns are missing', async () => {
    const { service } = await buildService();
    const csv = 'name,lat,lng\nCafe A,48.85,2.35';
    await expect(
      service.importPlacesCsv(adminId, csvBuffer(csv)),
    ).rejects.toThrow(BadRequestException);
  });

  it('records audit log once with summary counts', async () => {
    const { service } = await buildService();
    const csv = 'name,lat,lng,address\nCafe A,48.85,2.35,St';
    await service.importPlacesCsv(adminId, csvBuffer(csv));

    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: adminId,
        action: 'place.bulk_import',
        targetType: 'place',
        meta: expect.objectContaining({ created: 1, errors: 0 }),
      }),
    );
  });
});

// ── ImportService.importGoogle (TAS-13) ──────────────────────────────────────

describe('ImportService.importGoogle', () => {
  const userId = 'user-1';

  const makeGeoJsonFeature = (overrides: Record<string, unknown> = {}) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [2.35, 48.85] },
    properties: {
      Title: 'My Cafe',
      address: '1 Rue Test',
      note: 'Great coffee',
      ...overrides,
    },
  });

  const makeLegacyItem = (overrides: Record<string, unknown> = {}) => ({
    title: 'My Bakery',
    location: { latitude: 48.86, longitude: 2.36, address: '2 Rue Test' },
    note: 'Yummy',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('imports GeoJSON FeatureCollection format', async () => {
    const { service, placeModel, savedPlaceModel } = await buildService();
    const result = await service.importGoogle(userId, {
      type: 'FeatureCollection',
      features: [makeGeoJsonFeature()],
    });

    expect(result.placesCreated).toBe(1);
    expect(result.savedCreated).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(placeModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Cafe',
        moderationStatus: 'pending',
        createdBy: userId,
      }),
    );
    expect(savedPlaceModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ user: userId, comment: 'Great coffee' }),
    );
  });

  it('imports legacy JSON array format', async () => {
    const { service, placeModel, savedPlaceModel } = await buildService();
    const result = await service.importGoogle(userId, [makeLegacyItem()]);

    expect(result.placesCreated).toBe(1);
    expect(result.savedCreated).toBe(1);
    expect(placeModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Bakery',
        moderationStatus: 'pending',
      }),
    );
    expect(savedPlaceModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ comment: 'Yummy' }),
    );
  });

  it('throws BadRequestException for unrecognized format', async () => {
    const { service } = await buildService();
    await expect(
      service.importGoogle(userId, { weird: true }),
    ).rejects.toThrow(BadRequestException);
  });

  it('dedupes: skips SavedPlace when already saved, existing place not counted again', async () => {
    const { service, placeModel, savedPlaceModel } = await buildService({
      placeFindOne: { _id: 'place-existing' },
      alreadySaved: true,
    });
    const result = await service.importGoogle(userId, {
      type: 'FeatureCollection',
      features: [makeGeoJsonFeature()],
    });

    expect(result.placesCreated).toBe(0);
    expect(result.savedCreated).toBe(0);
    expect(result.skipped).toBe(1);
    expect(placeModel.create).not.toHaveBeenCalled();
    expect(savedPlaceModel.create).not.toHaveBeenCalled();
  });

  it('awards place_create and save gamification actions per new entry', async () => {
    const { service } = await buildService();
    await service.importGoogle(userId, {
      type: 'FeatureCollection',
      features: [
        makeGeoJsonFeature(),
        makeGeoJsonFeature({ Title: 'Other Cafe' }),
      ],
    });

    expect(gamificationMock.award).toHaveBeenCalledWith(userId, 'place_create');
    expect(gamificationMock.award).toHaveBeenCalledWith(userId, 'save');
    // 2 features → 2 × (place_create + save) = 4 calls
    expect(gamificationMock.award).toHaveBeenCalledTimes(4);
  });

  it('records audit log once with google import counts', async () => {
    const { service } = await buildService();
    await service.importGoogle(userId, [makeLegacyItem()]);

    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: userId,
        action: 'import.google',
        targetType: 'import',
        meta: expect.objectContaining({
          placesCreated: 1,
          savedCreated: 1,
          skipped: 0,
        }),
      }),
    );
  });
});
