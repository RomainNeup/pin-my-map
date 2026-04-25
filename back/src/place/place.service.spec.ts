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
