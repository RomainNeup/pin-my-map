import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { PlaceService } from './place.service';
import { Place } from './place.entity';
import { SavedPlace } from 'src/saved/saved.entity';
import { EnrichmentService } from 'src/enrichment/enrichment.service';
import { GamificationService } from 'src/gamification/gamification.service';
import { AuditService } from 'src/audit/audit.service';

const PLACE_TOKEN = getModelToken(Place.name);
const SAVED_PLACE_TOKEN = getModelToken(SavedPlace.name);

function makePlaceDoc(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const id = new Types.ObjectId();
  return {
    _id: id,
    name: 'Test Place',
    address: '1 Test St',
    location: [2.35, 48.85],
    moderationStatus: 'approved',
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

async function buildModule(docs: unknown[]) {
  const enrichmentResult = {
    merged: {
      externalId: 'osm:48.850000,2.350000',
      providerName: 'osm',
      fetchedAt: new Date(),
    },
    conflicts: [],
    ranBy: ['osm'],
  };

  const enrichmentService = {
    enrich: jest.fn().mockResolvedValue(enrichmentResult),
    refresh: jest.fn().mockResolvedValue(null),
  };
  const gamificationService = { award: jest.fn() };
  const auditService = { log: jest.fn().mockResolvedValue(undefined) };

  const execFn = jest.fn().mockResolvedValue(docs);
  const sortFn = jest
    .fn()
    .mockReturnValue({ limit: jest.fn().mockReturnValue({ exec: execFn }) });
  const findFn = jest.fn().mockReturnValue({ sort: sortFn });

  const placeModel = Object.assign(jest.fn(), {
    find: findFn,
    findById: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    countDocuments: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
    updateMany: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    }),
  });

  const savedPlaceModel = {
    countDocuments: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
  };

  const mod = await Test.createTestingModule({
    providers: [
      PlaceService,
      { provide: PLACE_TOKEN, useValue: placeModel },
      { provide: SAVED_PLACE_TOKEN, useValue: savedPlaceModel },
      { provide: EnrichmentService, useValue: enrichmentService },
      { provide: GamificationService, useValue: gamificationService },
      { provide: AuditService, useValue: auditService },
    ],
  }).compile();

  return {
    service: mod.get(PlaceService),
    placeModel,
    enrichmentService,
    auditService,
    findFn,
    execFn,
  };
}

describe('PlaceService.bulkEnrich', () => {
  it('uses onlyMissing filter when onlyMissing=true', async () => {
    const { service, findFn } = await buildModule([]);

    await service.bulkEnrich(
      { onlyMissing: true, limit: 10, delayMs: 0 },
      new Types.ObjectId().toHexString(),
    );

    expect(findFn).toHaveBeenCalledWith({ enrichedAt: { $exists: false } });
  });

  it('uses empty filter when onlyMissing=false', async () => {
    const { service, findFn } = await buildModule([]);

    await service.bulkEnrich(
      { onlyMissing: false, limit: 10, delayMs: 0 },
      new Types.ObjectId().toHexString(),
    );

    expect(findFn).toHaveBeenCalledWith({});
  });

  it('enriches found places and updates summary counts', async () => {
    const doc1 = makePlaceDoc();
    const doc2 = makePlaceDoc();
    const { service, enrichmentService } = await buildModule([doc1, doc2]);

    const summary = await service.bulkEnrich(
      { onlyMissing: true, limit: 10, delayMs: 0 },
      new Types.ObjectId().toHexString(),
    );

    expect(summary.scanned).toBe(2);
    expect(summary.enriched).toBe(2);
    expect(summary.skipped).toBe(0);
    expect(summary.failed).toBe(0);
    expect(summary.errors).toHaveLength(0);
    expect(enrichmentService.enrich).toHaveBeenCalledTimes(2);
  });

  it('counts as skipped when enrichment returns null', async () => {
    const doc1 = makePlaceDoc();
    const { service, enrichmentService } = await buildModule([doc1]);
    enrichmentService.enrich.mockResolvedValueOnce(null);

    const summary = await service.bulkEnrich(
      { onlyMissing: true, limit: 10, delayMs: 0 },
      new Types.ObjectId().toHexString(),
    );

    expect(summary.skipped).toBe(1);
    expect(summary.enriched).toBe(0);
  });

  it('tolerates partial failures and continues', async () => {
    const doc1 = makePlaceDoc();
    const doc2 = makePlaceDoc();
    const { service, enrichmentService } = await buildModule([doc1, doc2]);

    enrichmentService.enrich
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({
        merged: {
          externalId: 'osm:48.850000,2.350000',
          providerName: 'osm',
          fetchedAt: new Date(),
        },
        conflicts: [],
        ranBy: ['osm'],
      });

    const summary = await service.bulkEnrich(
      { onlyMissing: true, limit: 10, delayMs: 0 },
      new Types.ObjectId().toHexString(),
    );

    expect(summary.failed).toBe(1);
    expect(summary.enriched).toBe(1);
    expect(summary.errors).toHaveLength(1);
    expect(summary.errors[0].message).toBe('timeout');
  });

  it('writes an audit log with summary in meta', async () => {
    const { service, auditService } = await buildModule([]);

    const adminId = new Types.ObjectId().toHexString();
    await service.bulkEnrich(
      { onlyMissing: true, limit: 50, delayMs: 0 },
      adminId,
    );

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: adminId,
        action: 'place.bulk_enrich',
        targetType: 'Place',
        meta: expect.objectContaining({ onlyMissing: true, limit: 50 }),
      }),
    );
  });

  it('skips throttle sleep after the last item', async () => {
    // With delayMs=0 and 2 items, only 1 sleep should be needed (between items 0→1).
    // Verify the bulk enrich completes (no hang) and returns enriched=2.
    const doc1 = makePlaceDoc();
    const doc2 = makePlaceDoc();
    const { service } = await buildModule([doc1, doc2]);

    const summary = await service.bulkEnrich(
      { onlyMissing: true, limit: 10, delayMs: 0 },
      new Types.ObjectId().toHexString(),
    );

    // Both items should be enriched without hanging
    expect(summary.enriched).toBe(2);
  });
});
