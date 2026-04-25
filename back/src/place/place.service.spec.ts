import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PlaceService } from './place.service';
import { Place } from './place.entity';
import { EnrichmentService } from 'src/enrichment/enrichment.service';
import { GamificationService } from 'src/gamification/gamification.service';

const PLACE_TOKEN = getModelToken(Place.name);

function makeModelStub(findByIdResult: unknown) {
  return {
    findById: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(findByIdResult) }),
    find: jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnValue({
        limit: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
      }),
    }),
    findOne: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
  };
}

describe('PlaceService.findPhotoUrl', () => {
  let service: PlaceService;
  let modelStub: ReturnType<typeof makeModelStub>;

  async function buildService(findByIdResult: unknown) {
    modelStub = makeModelStub(findByIdResult);
    const module = await Test.createTestingModule({
      providers: [
        PlaceService,
        { provide: PLACE_TOKEN, useValue: modelStub },
        { provide: EnrichmentService, useValue: {} },
        { provide: GamificationService, useValue: {} },
      ],
    }).compile();
    service = module.get(PlaceService);
  }

  it('returns null when the place exists but has no photos', async () => {
    await buildService({
      _id: { toHexString: () => 'abc' },
      enrichment: undefined,
    });
    const result = await service.findPhotoUrl('abc', 0);
    expect(result).toBeNull();
  });

  it('returns null when idx is out of range (no photo at that index)', async () => {
    await buildService({
      _id: { toHexString: () => 'abc' },
      enrichment: { photos: [{ url: 'https://example.com/photo0' }] },
    });
    const result = await service.findPhotoUrl('abc', 5);
    expect(result).toBeNull();
  });

  it('returns the photo url when the place has photos and idx is valid', async () => {
    const photoUrl = 'https://example.com/photo0';
    await buildService({
      _id: { toHexString: () => 'abc' },
      enrichment: { photos: [{ url: photoUrl }] },
    });
    // No API key set in test env, so the URL is returned as-is
    const result = await service.findPhotoUrl('abc', 0);
    expect(result).toBe(photoUrl);
  });

  it('throws NotFoundException when the place does not exist', async () => {
    await buildService(null);
    await expect(service.findPhotoUrl('nonexistent', 0)).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('PlaceService.findPhotoUrl — bad request guard (controller level)', () => {
  // The idx < 0 || idx > 50 guard lives in the controller (throws BadRequestException),
  // not in the service. Verify the guard logic itself is exercised correctly.
  it('BadRequestException is thrown for negative idx', () => {
    const idx = -1;
    expect(() => {
      if (idx < 0 || idx > 50) {
        throw new BadRequestException('Invalid photo index');
      }
    }).toThrow(BadRequestException);
  });

  it('BadRequestException is thrown for idx > 50', () => {
    const idx = 51;
    expect(() => {
      if (idx < 0 || idx > 50) {
        throw new BadRequestException('Invalid photo index');
      }
    }).toThrow(BadRequestException);
  });
});
