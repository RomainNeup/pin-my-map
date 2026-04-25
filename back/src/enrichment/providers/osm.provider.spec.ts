import { OsmProvider, _resetNominatimChain } from './osm.provider';

const nominatimPayload = {
  place_id: 12345,
  type: 'restaurant',
  display_name: 'Test Restaurant, Paris',
  address: {
    road: 'Rue de Rivoli',
    city: 'Paris',
    country: 'France',
  },
  extratags: {
    website: 'https://example.com',
    phone: '+33 1 23 45 67 89',
    opening_hours: 'Mo-Su 09:00-22:00',
    cuisine: 'french',
  },
};

const wikiPayload = {
  extract: 'A famous restaurant in Paris.',
  thumbnail: { source: 'https://upload.wikimedia.org/thumb.jpg' },
};

function mockFetch(
  nominatimResponse: unknown,
  wikiResponse: unknown,
  wikiStatus = 200,
) {
  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('nominatim')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(nominatimResponse),
        text: () => Promise.resolve(''),
      });
    }
    // Wikipedia
    return Promise.resolve({
      ok: wikiStatus === 200,
      status: wikiStatus,
      json: () => Promise.resolve(wikiResponse),
      text: () => Promise.resolve(''),
    });
  });
}

// The OSM provider uses a module-level promise chain that applies a 1100ms delay
// between Nominatim calls. We reset the chain and use fake timers so tests don't block.
describe('OsmProvider', () => {
  let provider: OsmProvider;

  beforeEach(() => {
    // Reset the module-level throttle chain so each test starts clean
    _resetNominatimChain();
    jest.useFakeTimers();
    provider = new OsmProvider();
  });

  afterEach(() => {
    jest.runAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  async function runWithTimers<T>(promise: Promise<T>): Promise<T> {
    // Advance all pending timers so the Nominatim throttle delay resolves
    jest.runAllTimers();
    return promise;
  }

  it('isAvailable() always returns true', () => {
    expect(provider.isAvailable()).toBe(true);
  });

  it('maps Nominatim + Wikipedia data to EnrichmentResult', async () => {
    mockFetch(nominatimPayload, wikiPayload);

    const result = await runWithTimers(
      provider.lookup({ name: 'Test Restaurant', location: [2.35, 48.85] }),
    );

    expect(result).not.toBeNull();
    expect(result!.providerName).toBe('osm');
    expect(result!.website).toBe('https://example.com');
    expect(result!.phoneNumber).toBe('+33 1 23 45 67 89');
    expect(result!.openingHours?.weekdayText).toEqual(['Mo-Su 09:00-22:00']);
    expect(result!.types).toContain('restaurant');
    expect(result!.types).toContain('cuisine:french');
    expect(result!.googleMapsUri).toBe(
      'https://www.google.com/maps/search/?api=1&query=48.85,2.35',
    );
    expect(result!.description).toBe('A famous restaurant in Paris.');
    expect(result!.photos).toHaveLength(1);
    expect(result!.photos![0].url).toBe(
      'https://upload.wikimedia.org/thumb.jpg',
    );
    expect(result!.photos![0].attribution).toBe('Wikipedia');
  });

  it('skips Wikipedia photo when Wikipedia returns 404', async () => {
    mockFetch(nominatimPayload, null, 404);

    const result = await runWithTimers(
      provider.lookup({ name: 'Unknown Place', location: [2.35, 48.85] }),
    );

    expect(result).not.toBeNull();
    expect(result!.photos).toBeUndefined();
    expect(result!.description).toBeUndefined();
  });

  it('returns null when Nominatim responds with a non-OK status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Too Many Requests'),
    });

    const result = await runWithTimers(
      provider.lookup({ name: 'Test', location: [0, 0] }),
    );

    expect(result).toBeNull();
  });

  it('builds a stable externalId from lat/lng', async () => {
    mockFetch(nominatimPayload, null, 404);

    const result = await runWithTimers(
      provider.lookup({ name: 'Test', location: [2.3522, 48.8566] }),
    );

    expect(result!.externalId).toBe('osm:48.856600,2.352200');
  });
});
