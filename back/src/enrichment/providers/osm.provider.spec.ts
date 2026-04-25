import { OsmProvider, _resetNominatimChain } from './osm.provider';

// ── Nominatim payloads ───────────────────────────────────────────────────────

/** A museum (landmark) — Wikipedia lookup IS expected */
const museumPayload = {
  place_id: 11111,
  category: 'tourism',
  type: 'museum',
  display_name: 'Louvre Museum, Paris',
  address: {
    road: 'Rue de Rivoli',
    city: 'Paris',
    country: 'France',
  },
  extratags: {
    website: 'https://louvre.fr',
    phone: '+33 1 40 20 53 17',
    opening_hours: 'Mo-Su 09:00-18:00',
  },
};

/** Museum with OSM wikipedia extratag — used instead of name-match */
const museumWithWikiTagPayload = {
  place_id: 22222,
  category: 'tourism',
  type: 'museum',
  display_name: 'Louvre Museum, Paris',
  address: {},
  extratags: {
    wikipedia: 'en:Louvre',
  },
};

/** A restaurant — Wikipedia lookup should be SKIPPED */
const restaurantPayload = {
  place_id: 33333,
  category: 'amenity',
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

/** A disused place — permanentlyClosed should be set */
const disusedPayload = {
  place_id: 44444,
  category: 'amenity',
  type: 'restaurant',
  display_name: 'Closed Cafe, Paris',
  address: {},
  extratags: {
    disused: 'yes',
  },
};

/** A place with social links in extratags */
const socialLinksPayload = {
  place_id: 55555,
  category: 'tourism',
  type: 'museum',
  display_name: 'Modern Art Gallery',
  address: {},
  extratags: {
    'contact:instagram': 'https://instagram.com/gallery',
    'contact:facebook': 'modernartgallery',
    website: 'https://gallery.example.com',
  },
};

/** A restaurant with amenities */
const amenitiesPayload = {
  place_id: 66666,
  category: 'amenity',
  type: 'cafe',
  display_name: 'Healthy Cafe',
  address: {},
  extratags: {
    wheelchair: 'yes',
    outdoor_seating: 'yes',
    internet_access: 'wlan',
    'diet:vegetarian': 'yes',
    'diet:vegan': 'only',
    'diet:gluten_free': 'no',
  },
};

const wikiPayload = {
  extract: 'A famous museum in Paris.',
  thumbnail: { source: 'https://upload.wikimedia.org/thumb.jpg' },
};

// ── Mock helpers ─────────────────────────────────────────────────────────────

/**
 * Configures global.fetch so:
 *  - Nominatim calls return nominatimResponse (ok=true)
 *  - Wikipedia calls return wikiResponse with wikiStatus
 */
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

// ── Test suite ────────────────────────────────────────────────────────────────

describe('OsmProvider', () => {
  let provider: OsmProvider;

  beforeEach(() => {
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
    jest.runAllTimers();
    return promise;
  }

  it('isAvailable() always returns true', () => {
    expect(provider.isAvailable()).toBe(true);
  });

  // ── Wikipedia gating ───────────────────────────────────────────────────────

  it('fetches Wikipedia for a museum (landmark) — name-match path', async () => {
    mockFetch(museumPayload, wikiPayload);

    const result = await runWithTimers(
      provider.lookup({ name: 'Louvre Museum', location: [2.33, 48.86] }),
    );

    expect(result).not.toBeNull();
    expect(result!.description).toBe('A famous museum in Paris.');
    expect(result!.photos).toHaveLength(1);
    expect(result!.photos![0].attribution).toBe('Wikipedia');
    // Nominatim + Wikipedia both called
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('fetches Wikipedia via OSM wikipedia extratag (skips name-match)', async () => {
    mockFetch(museumWithWikiTagPayload, wikiPayload);

    const result = await runWithTimers(
      provider.lookup({ name: 'Louvre Museum', location: [2.33, 48.86] }),
    );

    expect(result).not.toBeNull();
    expect(result!.description).toBe('A famous museum in Paris.');
    // Wikipedia was called with the tag-derived title ("Louvre"), not the query name
    const wikiCall = (global.fetch as jest.Mock).mock.calls.find(
      (args: unknown[]) => String(args[0]).includes('wikipedia.org'),
    );
    expect(wikiCall).toBeDefined();
    expect(String(wikiCall![0])).toContain('Louvre');
  });

  it('skips Wikipedia for a restaurant (blacklisted POI type)', async () => {
    mockFetch(restaurantPayload, wikiPayload);

    const result = await runWithTimers(
      provider.lookup({ name: 'Test Restaurant', location: [2.35, 48.85] }),
    );

    expect(result).not.toBeNull();
    expect(result!.providerName).toBe('osm');
    expect(result!.website).toBe('https://example.com');
    expect(result!.types).toContain('restaurant');
    expect(result!.types).toContain('cuisine:french');
    // Wikipedia should NOT have been called (only 1 call = Nominatim)
    expect(global.fetch).toHaveBeenCalledTimes(1);
    // No description or Wikipedia photo
    expect(result!.description).toBeUndefined();
    expect(result!.photos).toBeUndefined();
  });

  it('skips Wikipedia photo when Wikipedia returns 404 for a museum', async () => {
    mockFetch(museumPayload, null, 404);

    const result = await runWithTimers(
      provider.lookup({ name: 'Unknown Museum', location: [2.35, 48.85] }),
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
    mockFetch(museumPayload, null, 404);

    const result = await runWithTimers(
      provider.lookup({ name: 'Test', location: [2.3522, 48.8566] }),
    );

    expect(result!.externalId).toBe('osm:48.856600,2.352200');
  });

  // ── permanentlyClosed ──────────────────────────────────────────────────────

  it('sets permanentlyClosed=true when OSM has disused=yes', async () => {
    mockFetch(disusedPayload, null, 404);

    const result = await runWithTimers(
      provider.lookup({ name: 'Closed Cafe', location: [2.35, 48.85] }),
    );

    expect(result).not.toBeNull();
    expect(result!.permanentlyClosed).toBe(true);
  });

  it('does not set permanentlyClosed for a normal place', async () => {
    mockFetch(museumPayload, null, 404);

    const result = await runWithTimers(
      provider.lookup({ name: 'Louvre', location: [2.33, 48.86] }),
    );

    expect(result!.permanentlyClosed).toBeUndefined();
  });

  // ── Social links ───────────────────────────────────────────────────────────

  it('extracts social links from extratags', async () => {
    mockFetch(socialLinksPayload, null, 404);

    const result = await runWithTimers(
      provider.lookup({ name: 'Modern Art Gallery', location: [2.35, 48.85] }),
    );

    expect(result).not.toBeNull();
    expect(result!.socialLinks?.instagram).toBe(
      'https://instagram.com/gallery',
    );
    // facebook was a bare handle — should be prefixed
    expect(result!.socialLinks?.facebook).toContain('modernartgallery');
  });

  it('derives social link from website domain heuristic', async () => {
    const instagramSitePayload = {
      ...restaurantPayload,
      extratags: { website: 'https://www.instagram.com/mycafe' },
    };
    mockFetch(instagramSitePayload, null, 404);

    const result = await runWithTimers(
      provider.lookup({ name: 'My Cafe', location: [2.35, 48.85] }),
    );

    expect(result!.socialLinks?.instagram).toBe(
      'https://www.instagram.com/mycafe',
    );
  });

  // ── Amenities ──────────────────────────────────────────────────────────────

  it('maps OSM accessibility and diet tags to amenities', async () => {
    mockFetch(amenitiesPayload, null, 404);

    const result = await runWithTimers(
      provider.lookup({ name: 'Healthy Cafe', location: [2.35, 48.85] }),
    );

    expect(result).not.toBeNull();
    expect(result!.amenities?.wheelchair).toBe('yes');
    expect(result!.amenities?.outdoorSeating).toBe(true);
    expect(result!.amenities?.wifi).toBe('wlan');
    expect(result!.amenities?.dietVegetarian).toBe('yes');
    expect(result!.amenities?.dietVegan).toBe('only');
    expect(result!.amenities?.dietGlutenFree).toBe('no');
  });

  it('leaves amenities undefined when no OSM tags present', async () => {
    mockFetch(museumPayload, null, 404);

    const result = await runWithTimers(
      provider.lookup({ name: 'Louvre', location: [2.33, 48.86] }),
    );

    expect(result!.amenities).toBeUndefined();
  });
});
