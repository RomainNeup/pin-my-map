import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SavedPlaceService, csvEscape } from './saved.service';
import { PlaceService } from 'src/place/place.service';
import { TagService } from 'src/tag/tag.service';
import { GamificationService } from 'src/gamification/gamification.service';

const SAVED_TOKEN = getModelToken('SavedPlace');

describe('csvEscape', () => {
  it('returns plain string when no special chars', () => {
    expect(csvEscape('hello')).toBe('hello');
  });

  it('wraps and doubles quotes when value contains a quote', () => {
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
  });

  it('wraps when value contains a comma', () => {
    expect(csvEscape('a, b')).toBe('"a, b"');
  });

  it('wraps when value contains a newline', () => {
    expect(csvEscape('line1\nline2')).toBe('"line1\nline2"');
    expect(csvEscape('line1\r\nline2')).toBe('"line1\r\nline2"');
  });

  it('returns empty string for null/undefined', () => {
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(undefined)).toBe('');
  });

  it('stringifies numbers and booleans', () => {
    expect(csvEscape(42)).toBe('42');
    expect(csvEscape(true)).toBe('true');
  });
});

describe('SavedPlaceService.exportCsv', () => {
  const userId = 'user-1';
  const HEADER = 'id,name,address,lat,lng,rating,done,comment,tags,createdAt';

  const buildService = async (savedPlaces: unknown[]) => {
    const savedPlaceModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(savedPlaces),
          }),
        }),
      }),
    };

    const mod = await Test.createTestingModule({
      providers: [
        SavedPlaceService,
        { provide: SAVED_TOKEN, useValue: savedPlaceModel },
        { provide: PlaceService, useValue: {} },
        { provide: TagService, useValue: {} },
        { provide: GamificationService, useValue: { award: jest.fn() } },
      ],
    }).compile();

    return {
      service: mod.get(SavedPlaceService),
      savedPlaceModel,
    };
  };

  it('returns header only when user has no saved places', async () => {
    const { service, savedPlaceModel } = await buildService([]);
    const csv = await service.exportCsv(userId);

    expect(csv).toBe(HEADER + '\r\n');
    expect(savedPlaceModel.find).toHaveBeenCalledWith({ user: userId });
  });

  it('escapes commas, quotes and newlines in comment per RFC 4180', async () => {
    const sp = {
      _id: { toHexString: () => 'sp-1' },
      place: {
        name: 'Cafe',
        address: '1 rue, Paris',
        location: [2.35, 48.85],
      },
      tags: [],
      rating: 4,
      done: false,
      comment: 'great, "amazing"\nview',
      createdAt: new Date('2025-01-15T10:00:00.000Z'),
    };
    const { service } = await buildService([sp]);
    const csv = await service.exportCsv(userId);

    const lines = csv.split('\r\n');
    expect(lines[0]).toBe(HEADER);
    expect(lines[1]).toBe(
      'sp-1,Cafe,"1 rue, Paris",48.85,2.35,4,false,' +
        '"great, ""amazing""\nview",,2025-01-15T10:00:00.000Z',
    );
    // trailing CRLF
    expect(lines[2]).toBe('');
  });

  it('joins tags with pipe separator', async () => {
    const sp = {
      _id: { toHexString: () => 'sp-2' },
      place: {
        name: 'Bar',
        address: '2 St',
        location: [2, 1],
      },
      tags: [{ name: 'beer' }, { name: 'music' }],
      rating: undefined,
      done: true,
      comment: '',
      createdAt: new Date('2025-02-01T00:00:00.000Z'),
    };
    const { service } = await buildService([sp]);
    const csv = await service.exportCsv(userId);

    const dataLine = csv.split('\r\n')[1];
    expect(dataLine).toBe(
      'sp-2,Bar,2 St,1,2,,true,,beer|music,2025-02-01T00:00:00.000Z',
    );
  });

  it('replaces literal pipes inside tag names so the join stays unambiguous', async () => {
    const sp = {
      _id: { toHexString: () => 'sp-3' },
      place: {
        name: 'Spot',
        address: 'addr',
        location: [0, 0],
      },
      tags: [{ name: 'a|b' }, { name: 'c' }],
      done: false,
      comment: '',
      createdAt: new Date('2025-03-01T00:00:00.000Z'),
    };
    const { service } = await buildService([sp]);
    const csv = await service.exportCsv(userId);

    const dataLine = csv.split('\r\n')[1];
    expect(dataLine).toContain(',a b|c,');
  });
});
