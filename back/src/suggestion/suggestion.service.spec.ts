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
