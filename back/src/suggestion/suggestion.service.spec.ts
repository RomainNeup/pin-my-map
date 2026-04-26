import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { SuggestionService } from './suggestion.service';
import { PlaceSuggestion } from './suggestion.entity';
import { Place } from 'src/place/place.entity';
import { PlaceService } from 'src/place/place.service';
import { AuditService } from 'src/audit/audit.service';
import { GamificationService } from 'src/gamification/gamification.service';

describe('SuggestionService — listMine / countForPlace', () => {
  const userA = new Types.ObjectId().toHexString();
  const userB = new Types.ObjectId().toHexString();
  const placeId = new Types.ObjectId().toHexString();

  const buildService = (
    opts: {
      mineDocs?: unknown[];
      countPending?: number;
      countTotal?: number;
    } = {},
  ) => {
    const findChain = {
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(opts.mineDocs ?? []),
    };

    const suggestionModel = {
      find: jest.fn().mockReturnValue(findChain),
      countDocuments: jest.fn().mockImplementation((q: { status?: string }) => {
        const v =
          q.status === 'pending'
            ? (opts.countPending ?? 0)
            : (opts.countTotal ?? 0);
        return Promise.resolve(v);
      }),
      findById: jest.fn(),
      create: jest.fn(),
    };
    const placeModel = { updateOne: jest.fn() };

    return Test.createTestingModule({
      providers: [
        SuggestionService,
        {
          provide: getModelToken(PlaceSuggestion.name),
          useValue: suggestionModel,
        },
        { provide: getModelToken(Place.name), useValue: placeModel },
        { provide: PlaceService, useValue: { findOne: jest.fn() } },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: GamificationService, useValue: { award: jest.fn() } },
      ],
    })
      .compile()
      .then((mod) => ({
        service: mod.get(SuggestionService),
        suggestionModel,
        findChain,
      }));
  };

  it('listMine queries by submitter only, sorted desc', async () => {
    const { service, suggestionModel, findChain } = await buildService({
      mineDocs: [],
    });
    await service.listMine(userA);
    expect(suggestionModel.find).toHaveBeenCalledTimes(1);
    const arg = (suggestionModel.find as jest.Mock).mock.calls[0][0];
    expect(arg.user.toString()).toBe(userA);
    expect(findChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(findChain.populate).toHaveBeenCalledWith(['user', 'place']);
  });

  it('listMine isolates user A from user B suggestions', async () => {
    const { service, suggestionModel } = await buildService({ mineDocs: [] });
    await service.listMine(userB);
    const arg = (suggestionModel.find as jest.Mock).mock.calls[0][0];
    expect(arg.user.toString()).toBe(userB);
    expect(arg.user.toString()).not.toBe(userA);
  });

  it('listMine rejects an invalid userId', async () => {
    const { service } = await buildService();
    await expect(service.listMine('not-a-mongo-id')).rejects.toThrow(
      'Invalid userId',
    );
  });

  it('countForPlace returns pending and total counts', async () => {
    const { service, suggestionModel } = await buildService({
      countPending: 2,
      countTotal: 5,
    });
    const result = await service.countForPlace(placeId);
    expect(result).toEqual({ pending: 2, total: 5 });
    expect(suggestionModel.countDocuments).toHaveBeenCalledTimes(2);
  });

  it('countForPlace rejects an invalid placeId', async () => {
    const { service } = await buildService();
    await expect(service.countForPlace('bogus')).rejects.toThrow(
      'Invalid placeId',
    );
  });
});

// ── permanentlyClosed via suggestion ─────────────────────────────────────────

describe('SuggestionService — permanentlyClosed', () => {
  const userId = new Types.ObjectId().toHexString();
  const placeId = new Types.ObjectId().toHexString();
  const suggestionId = new Types.ObjectId().toHexString();
  const adminId = new Types.ObjectId().toHexString();

  /** Build a minimal PlaceDto-like object for `placeService.findOne`. */
  const buildPlaceDto = (overrides: Record<string, unknown> = {}) => ({
    id: placeId,
    name: 'Test Place',
    description: 'A place',
    address: '1 rue de la Paix',
    image: '',
    location: { lat: 48.87, lng: 2.33 },
    permanentlyClosed: false,
    ...overrides,
  });

  /** Build the full test module wired for create / approve flows. */
  const buildFullService = (
    currentPlace: ReturnType<typeof buildPlaceDto>,
    placeModelUpdateOne = jest.fn().mockReturnValue({ exec: jest.fn() }),
  ) => {
    const createdDoc = {
      _id: new Types.ObjectId(suggestionId),
      user: new Types.ObjectId(userId),
      place: new Types.ObjectId(placeId),
      changes: {} as Record<string, unknown>,
      status: 'pending',
      note: undefined,
      save: jest.fn(),
    };

    // Tracks changes passed to .create()
    const createdCapture: { changes?: Record<string, unknown> } = {};

    const findByIdChain = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    };

    const suggestionModel = {
      create: jest.fn().mockImplementation((doc) => {
        createdCapture.changes = doc.changes;
        Object.assign(createdDoc, { changes: doc.changes });
        return Promise.resolve(createdDoc);
      }),
      findById: jest.fn().mockImplementation(() => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(createdDoc),
      })),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([]),
      }),
      countDocuments: jest.fn().mockResolvedValue(0),
    };

    const placeService = {
      findOne: jest.fn().mockResolvedValue(currentPlace),
    };

    void findByIdChain;

    return Test.createTestingModule({
      providers: [
        SuggestionService,
        {
          provide: getModelToken(PlaceSuggestion.name),
          useValue: suggestionModel,
        },
        {
          provide: getModelToken(Place.name),
          useValue: { updateOne: placeModelUpdateOne },
        },
        { provide: PlaceService, useValue: placeService },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: GamificationService, useValue: { award: jest.fn() } },
      ],
    })
      .compile()
      .then((mod) => ({
        service: mod.get(SuggestionService),
        suggestionModel,
        placeModelUpdateOne,
        createdCapture,
        createdDoc,
        placeService,
      }));
  };

  it('create stores permanentlyClosed=true in changes when place is currently open', async () => {
    const currentPlace = buildPlaceDto({ permanentlyClosed: false });
    const { service, createdCapture } = await buildFullService(currentPlace);

    await service.create(userId, {
      placeId,
      changes: { permanentlyClosed: true },
    });

    expect(createdCapture.changes).toMatchObject({ permanentlyClosed: true });
  });

  it('create does NOT include permanentlyClosed when the value matches the current state', async () => {
    const currentPlace = buildPlaceDto({ permanentlyClosed: true });
    const { service } = await buildFullService(currentPlace);

    await expect(
      service.create(userId, {
        placeId,
        changes: { permanentlyClosed: true },
      }),
    ).rejects.toThrow('No changes to suggest');
  });

  it('approve sets permanentlyClosed=true and permanentlyClosedAt on the place', async () => {
    const updateOne = jest.fn().mockReturnValue({ exec: jest.fn() });
    const currentPlace = buildPlaceDto({ permanentlyClosed: false });
    const { service, createdDoc } = await buildFullService(
      currentPlace,
      updateOne,
    );

    // Simulate an existing suggestion entity with permanentlyClosed
    Object.assign(createdDoc, {
      changes: { permanentlyClosed: true },
      status: 'pending',
      save: jest.fn(),
    });

    await service.approve(suggestionId, adminId);

    expect(updateOne).toHaveBeenCalledWith(
      { _id: placeId },
      expect.objectContaining({
        $set: expect.objectContaining({
          permanentlyClosed: true,
          permanentlyClosedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('approve clears permanentlyClosedAt when permanentlyClosed becomes false', async () => {
    const updateOne = jest.fn().mockReturnValue({ exec: jest.fn() });
    const currentPlace = buildPlaceDto({ permanentlyClosed: true });
    const { service, createdDoc } = await buildFullService(
      currentPlace,
      updateOne,
    );

    Object.assign(createdDoc, {
      changes: { permanentlyClosed: false },
      status: 'pending',
      save: jest.fn(),
    });

    await service.approve(suggestionId, adminId);

    expect(updateOne).toHaveBeenCalledWith(
      { _id: placeId },
      expect.objectContaining({
        $set: expect.objectContaining({
          permanentlyClosed: false,
          permanentlyClosedAt: null,
        }),
      }),
    );
  });
});
