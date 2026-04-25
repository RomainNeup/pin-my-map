import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PlaceService } from './place.service';
import { Place } from './place.entity';
import { EnrichmentService } from 'src/enrichment/enrichment.service';
import { GamificationService } from 'src/gamification/gamification.service';
import { AuditService } from 'src/audit/audit.service';

const PLACE_TOKEN = getModelToken(Place.name);

const creatorId = new Types.ObjectId().toHexString();
const otherId = new Types.ObjectId().toHexString();
const placeId = new Types.ObjectId().toHexString();

type MockPlaceDoc = {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  address?: string;
  image?: string;
  location: number[];
  createdBy?: Types.ObjectId;
};

function buildPlaceDoc(overrides: Partial<MockPlaceDoc> = {}): MockPlaceDoc {
  return {
    _id: new Types.ObjectId(placeId),
    name: 'Original',
    description: 'A first description',
    address: '1 Test Street',
    image: '',
    location: [2.35, 48.85],
    createdBy: new Types.ObjectId(creatorId),
    ...overrides,
  };
}

const updatePayload = {
  name: 'Updated Name',
  address: '2 Updated Street',
  description: 'A different description longer than 10 chars',
  image: '',
  location: { lng: 2.35, lat: 48.85 },
};

const buildService = (initialDoc: MockPlaceDoc | null) => {
  const updatedDoc = initialDoc
    ? { ...initialDoc, name: updatePayload.name }
    : null;

  const placeModel = {
    findById: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(initialDoc),
    }),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(updatedDoc),
    }),
  };
  const enrichmentService = { enrich: jest.fn(), refresh: jest.fn() };
  const gamificationService = { award: jest.fn() };
  const auditService = { log: jest.fn().mockResolvedValue(undefined) };

  return Test.createTestingModule({
    providers: [
      PlaceService,
      { provide: PLACE_TOKEN, useValue: placeModel },
      { provide: EnrichmentService, useValue: enrichmentService },
      { provide: GamificationService, useValue: gamificationService },
      { provide: AuditService, useValue: auditService },
    ],
  })
    .compile()
    .then((mod) => ({
      service: mod.get(PlaceService),
      placeModel,
      auditService,
    }));
};

describe('PlaceService.update', () => {
  it('lets the creator edit their own place', async () => {
    const { service, placeModel, auditService } =
      await buildService(buildPlaceDoc());

    const result = await service.update(placeId, updatePayload, {
      id: creatorId,
      role: 'user',
    });

    expect(result.id).toBe(placeId);
    expect(placeModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: creatorId,
        action: 'place.update',
        targetType: 'Place',
        targetId: placeId,
        before: expect.objectContaining({ name: 'Original' }),
        after: expect.objectContaining({ name: 'Updated Name' }),
      }),
    );
  });

  it('rejects a non-creator non-admin with 403', async () => {
    const { service, placeModel, auditService } =
      await buildService(buildPlaceDoc());

    await expect(
      service.update(placeId, updatePayload, {
        id: otherId,
        role: 'user',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(placeModel.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(auditService.log).not.toHaveBeenCalled();
  });

  it('lets an admin edit any place', async () => {
    const { service, placeModel, auditService } =
      await buildService(buildPlaceDoc());

    await service.update(placeId, updatePayload, {
      id: otherId,
      role: 'admin',
    });

    expect(placeModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
    expect(auditService.log).toHaveBeenCalledTimes(1);
  });

  it('lets a creator edit even when no role is supplied', async () => {
    const { service, auditService } = await buildService(buildPlaceDoc());

    await service.update(placeId, updatePayload, { id: creatorId });

    expect(auditService.log).toHaveBeenCalledTimes(1);
  });

  it('throws 404 when the place does not exist', async () => {
    const { service } = await buildService(null);

    await expect(
      service.update(placeId, updatePayload, {
        id: creatorId,
        role: 'user',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects when place has no createdBy and caller is not admin', async () => {
    const { service } = await buildService(
      buildPlaceDoc({ createdBy: undefined }),
    );

    await expect(
      service.update(placeId, updatePayload, {
        id: creatorId,
        role: 'user',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not fail the update if audit logging throws', async () => {
    const { service, auditService } = await buildService(buildPlaceDoc());
    auditService.log.mockRejectedValueOnce(new Error('audit DB down'));

    await expect(
      service.update(placeId, updatePayload, {
        id: creatorId,
        role: 'user',
      }),
    ).resolves.toBeDefined();
  });
});

describe('PlaceService moderation', () => {
  const buildService = (
    opts: {
      pendingPlaces?: unknown[];
      placeForId?: Record<string, unknown> | null;
    } = {},
  ) => {
    const docSave = jest.fn().mockImplementation(function (this: unknown) {
      return Promise.resolve(this);
    });

    const placeDoc: Record<string, unknown> | null = opts.placeForId
      ? {
          ...opts.placeForId,
          save: docSave,
        }
      : null;

    const findChain = {
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(opts.pendingPlaces ?? []),
      }),
    };

    const placeModel = Object.assign(
      jest.fn().mockImplementation((doc: Record<string, unknown>) => ({
        ...doc,
        _id: { toHexString: () => 'new-id' },
        save: jest.fn().mockResolvedValue({
          ...doc,
          _id: { toHexString: () => 'new-id' },
          location: doc.location,
        }),
      })),
      {
        find: jest.fn().mockReturnValue(findChain),
        findById: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(placeDoc) }),
        countDocuments: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
        updateMany: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
        }),
      },
    );

    const enrichmentService = {
      enrich: jest.fn().mockResolvedValue(null),
      refresh: jest.fn().mockResolvedValue(null),
    };
    const gamificationService = { award: jest.fn().mockResolvedValue({}) };
    const auditService = { log: jest.fn().mockResolvedValue(undefined) };

    return Test.createTestingModule({
      providers: [
        PlaceService,
        { provide: getModelToken(Place.name), useValue: placeModel },
        { provide: EnrichmentService, useValue: enrichmentService },
        { provide: GamificationService, useValue: gamificationService },
        { provide: AuditService, useValue: auditService },
      ],
    })
      .compile()
      .then((mod) => ({
        service: mod.get(PlaceService),
        placeModel,
        gamificationService,
        auditService,
        placeDoc,
      }));
  };

  it('findAll filters to approved places only', async () => {
    const { service, placeModel } = await buildService({ pendingPlaces: [] });
    (placeModel.find as jest.Mock).mockReturnValueOnce({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    });
    await service.findAll();
    expect(placeModel.find).toHaveBeenCalledWith({
      moderationStatus: 'approved',
    });
  });

  it('search filters to approved places only', async () => {
    const { service, placeModel } = await buildService();
    (placeModel.find as jest.Mock).mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue([]),
    });
    await service.search('cafe');
    const arg = (placeModel.find as jest.Mock).mock.calls[0][0];
    expect(arg.moderationStatus).toBe('approved');
  });

  it('listPending returns only pending places sorted by recency', async () => {
    const { service, placeModel } = await buildService({
      pendingPlaces: [],
    });
    await service.listPending();
    expect(placeModel.find).toHaveBeenCalledWith({
      moderationStatus: 'pending',
    });
  });

  it('approve flips status, awards gamification to creator, and audits', async () => {
    const creatorId = new Types.ObjectId();
    const placeId = new Types.ObjectId().toHexString();
    const { service, gamificationService, auditService, placeDoc } =
      await buildService({
        placeForId: {
          _id: { toHexString: () => placeId },
          name: 'X',
          location: [0, 0],
          address: 'a',
          description: 'd',
          image: 'i',
          createdBy: creatorId,
          moderationStatus: 'pending',
        },
      });

    await service.approve(placeId, new Types.ObjectId().toHexString());

    expect(placeDoc?.moderationStatus).toBe('approved');
    expect(gamificationService.award).toHaveBeenCalledWith(
      creatorId.toString(),
      'place_create',
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'place.approve', targetId: placeId }),
    );
  });

  it('approve refuses to re-approve an already-approved place', async () => {
    const placeId = new Types.ObjectId().toHexString();
    const { service } = await buildService({
      placeForId: {
        _id: { toHexString: () => placeId },
        name: 'X',
        location: [0, 0],
        address: 'a',
        description: 'd',
        image: 'i',
        moderationStatus: 'approved',
      },
    });

    await expect(
      service.approve(placeId, new Types.ObjectId().toHexString()),
    ).rejects.toThrow('already approved');
  });

  it('reject preserves the rejection reason and audits it', async () => {
    const placeId = new Types.ObjectId().toHexString();
    const { service, auditService, placeDoc } = await buildService({
      placeForId: {
        _id: { toHexString: () => placeId },
        name: 'X',
        location: [0, 0],
        address: 'a',
        description: 'd',
        image: 'i',
        moderationStatus: 'pending',
      },
    });

    await service.reject(
      placeId,
      new Types.ObjectId().toHexString(),
      '  spammy  ',
    );

    expect(placeDoc?.moderationStatus).toBe('rejected');
    expect(placeDoc?.rejectionReason).toBe('spammy');
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'place.reject',
        meta: { reason: 'spammy' },
      }),
    );
  });
});
