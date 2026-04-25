import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { PlaceService } from './place.service';
import { Place } from './place.entity';
import { EnrichmentService } from 'src/enrichment/enrichment.service';
import { GamificationService } from 'src/gamification/gamification.service';
import { AuditService } from 'src/audit/audit.service';

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
