import { MapboxProvider } from './mapbox.provider';

const FEATURE_WITH_POI = {
  id: 'poi.abc123',
  type: 'Feature',
  properties: {
    name: 'Eiffel Tower',
    full_address: 'Champ de Mars, 5 Avenue Anatole, 75007 Paris, France',
    feature_type: 'poi',
    poi_category: ['landmark', 'tourist attraction'],
    poi_category_ids: ['landmark', 'tourist_attraction'],
    coordinates: { longitude: 2.2945, latitude: 48.8584 },
  },
};

const FEATURE_WITHOUT_POI = {
  id: 'address.xyz789',
  type: 'Feature',
  properties: {
    name: '5 Avenue Anatole',
    full_address: '5 Avenue Anatole, 75007 Paris, France',
    feature_type: 'address',
    poi_category_ids: [],
    coordinates: { longitude: 2.2945, latitude: 48.8584 },
  },
};

function mockFetchSuccess(features: unknown[]) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ features }),
    text: () => Promise.resolve(''),
  });
}

function mockFetchError(status: number, body = '') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(body),
  });
}

describe('MapboxProvider', () => {
  let provider: MapboxProvider;
  const originalEnv = process.env;

  beforeEach(() => {
    provider = new MapboxProvider();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  // ── isAvailable ──────────────────────────────────────────────────────────────

  it('isAvailable() returns true when MAPBOX_ACCESS_TOKEN is set', () => {
    process.env.MAPBOX_ACCESS_TOKEN = 'pk.test_token';
    expect(provider.isAvailable()).toBe(true);
  });

  it('isAvailable() returns false when MAPBOX_ACCESS_TOKEN is unset', () => {
    delete process.env.MAPBOX_ACCESS_TOKEN;
    expect(provider.isAvailable()).toBe(false);
  });

  it('isAvailable() returns false when MAPBOX_ACCESS_TOKEN is empty string', () => {
    process.env.MAPBOX_ACCESS_TOKEN = '';
    expect(provider.isAvailable()).toBe(false);
  });

  // ── lookup — not configured ──────────────────────────────────────────────────

  it('returns null immediately when not configured', async () => {
    delete process.env.MAPBOX_ACCESS_TOKEN;
    global.fetch = jest.fn();

    const result = await provider.lookup({
      name: 'Eiffel Tower',
      location: [2.2945, 48.8584],
    });

    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // ── lookup — happy path ──────────────────────────────────────────────────────

  it('returns an EnrichmentResult with poi_category_ids as types', async () => {
    process.env.MAPBOX_ACCESS_TOKEN = 'pk.test_token';
    mockFetchSuccess([FEATURE_WITH_POI]);

    const result = await provider.lookup({
      name: 'Eiffel Tower',
      location: [2.2945, 48.8584],
    });

    expect(result).not.toBeNull();
    expect(result!.providerName).toBe('mapbox');
    expect(result!.externalId).toBe('mapbox:poi.abc123');
    expect(result!.types).toEqual(['landmark', 'tourist_attraction']);
    expect(result!.googleMapsUri).toBe(
      'https://www.google.com/maps/search/?api=1&query=48.8584,2.2945',
    );
    expect(result!.fetchedAt).toBeInstanceOf(Date);
  });

  it('leaves types undefined when poi_category_ids is empty', async () => {
    process.env.MAPBOX_ACCESS_TOKEN = 'pk.test_token';
    mockFetchSuccess([FEATURE_WITHOUT_POI]);

    const result = await provider.lookup({
      name: '5 Avenue Anatole',
      location: [2.2945, 48.8584],
    });

    expect(result).not.toBeNull();
    expect(result!.types).toBeUndefined();
  });

  it('calls the Mapbox reverse geocode URL with correct params', async () => {
    process.env.MAPBOX_ACCESS_TOKEN = 'pk.test_token';
    mockFetchSuccess([FEATURE_WITH_POI]);

    await provider.lookup({
      name: 'Eiffel Tower',
      location: [2.2945, 48.8584],
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain('api.mapbox.com/search/geocode/v6/reverse');
    expect(calledUrl).toContain('longitude=2.2945');
    expect(calledUrl).toContain('latitude=48.8584');
    expect(calledUrl).toContain('access_token=pk.test_token');
  });

  it('returns null when the API returns no features', async () => {
    process.env.MAPBOX_ACCESS_TOKEN = 'pk.test_token';
    mockFetchSuccess([]);

    const result = await provider.lookup({
      name: 'Middle of nowhere',
      location: [0, 0],
    });

    expect(result).toBeNull();
  });

  it('returns null when the API responds with an error status', async () => {
    process.env.MAPBOX_ACCESS_TOKEN = 'pk.test_token';
    mockFetchError(401, 'Unauthorized');

    const result = await provider.lookup({
      name: 'Test',
      location: [2.2945, 48.8584],
    });

    expect(result).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    process.env.MAPBOX_ACCESS_TOKEN = 'pk.test_token';
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await provider.lookup({
      name: 'Test',
      location: [2.2945, 48.8584],
    });

    expect(result).toBeNull();
  });

  // ── phone/website/photos/reviews ─────────────────────────────────────────────

  it('does not set phone, website, photos or reviews (not in Mapbox API)', async () => {
    process.env.MAPBOX_ACCESS_TOKEN = 'pk.test_token';
    mockFetchSuccess([FEATURE_WITH_POI]);

    const result = await provider.lookup({
      name: 'Eiffel Tower',
      location: [2.2945, 48.8584],
    });

    expect(result).not.toBeNull();
    expect(result!.phoneNumber).toBeUndefined();
    expect(result!.website).toBeUndefined();
    expect(result!.photos).toBeUndefined();
    expect(result!.reviews).toBeUndefined();
  });
});
