import { buildGoogleMapsCardUrl, buildPlaceSummary } from './place.mapper';
import { PlaceEnrichment } from './place.entity';

const baseEnrichment: PlaceEnrichment = {
  externalId: 'ext-1',
  providerName: 'google',
  fetchedAt: new Date('2024-01-01T00:00:00Z'),
};

describe('buildPlaceSummary', () => {
  it('returns undefined when enrichment is missing', () => {
    expect(buildPlaceSummary(undefined)).toBeUndefined();
  });

  it('returns undefined when no relevant fields are populated', () => {
    expect(buildPlaceSummary({ ...baseEnrichment })).toBeUndefined();
  });

  it('formats rating only', () => {
    expect(buildPlaceSummary({ ...baseEnrichment, externalRating: 4.6 })).toBe(
      '4.6 ★',
    );
  });

  it('formats rating with count under 1k', () => {
    expect(
      buildPlaceSummary({
        ...baseEnrichment,
        externalRating: 4.2,
        externalRatingCount: 320,
      }),
    ).toBe('4.2 ★ (320)');
  });

  it('formats rating with count above 1k as 1.2k', () => {
    expect(
      buildPlaceSummary({
        ...baseEnrichment,
        externalRating: 4.6,
        externalRatingCount: 1234,
      }),
    ).toBe('4.6 ★ (1.2k)');
  });

  it('formats rating with count above 10k as integer k', () => {
    expect(
      buildPlaceSummary({
        ...baseEnrichment,
        externalRating: 4.0,
        externalRatingCount: 12345,
      }),
    ).toBe('4.0 ★ (12k)');
  });

  it('omits count when it is zero', () => {
    expect(
      buildPlaceSummary({
        ...baseEnrichment,
        externalRating: 3.5,
        externalRatingCount: 0,
      }),
    ).toBe('3.5 ★');
  });

  it('formats price level only', () => {
    expect(buildPlaceSummary({ ...baseEnrichment, priceLevel: 2 })).toBe('$$');
  });

  it('maps priceLevel 1..4 to $..$$$$', () => {
    expect(buildPlaceSummary({ ...baseEnrichment, priceLevel: 1 })).toBe('$');
    expect(buildPlaceSummary({ ...baseEnrichment, priceLevel: 3 })).toBe('$$$');
    expect(buildPlaceSummary({ ...baseEnrichment, priceLevel: 4 })).toBe(
      '$$$$',
    );
  });

  it('returns undefined for out-of-range priceLevel only', () => {
    expect(
      buildPlaceSummary({ ...baseEnrichment, priceLevel: 5 }),
    ).toBeUndefined();
  });

  it('combines price and rating with bullet separator', () => {
    expect(
      buildPlaceSummary({
        ...baseEnrichment,
        priceLevel: 2,
        externalRating: 4.6,
        externalRatingCount: 1200,
      }),
    ).toBe('$$ • 4.6 ★ (1.2k)');
  });
});

// ── buildGoogleMapsCardUrl ────────────────────────────────────────────────────

describe('buildGoogleMapsCardUrl', () => {
  const loc = { lat: 48.87, lng: 2.33 };

  it('returns googleMapsUri verbatim when set (highest priority)', () => {
    const url = buildGoogleMapsCardUrl({
      name: 'Le Marais Café',
      location: loc,
      googleMapsUri: 'https://maps.google.com/?cid=1234567890',
    });
    expect(url).toBe('https://maps.google.com/?cid=1234567890');
  });

  it('appends query_place_id when provider is google and externalId is set', () => {
    const url = buildGoogleMapsCardUrl({
      name: 'Café de Flore',
      location: loc,
      externalProvider: 'google',
      externalId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    });
    expect(url).toContain('query_place_id=ChIJN1t_tDeuEmsRUsoyG83frY4');
    expect(url).toContain('query=48.87%2C2.33');
    expect(url).toContain('https://www.google.com/maps/search/?api=1');
  });

  it('uses name+address query when provider is mapbox', () => {
    const url = buildGoogleMapsCardUrl({
      name: 'Tour Eiffel',
      address: 'Champ de Mars, Paris',
      location: loc,
      externalProvider: 'mapbox',
      externalId: 'poi.1234',
    });
    expect(url).not.toContain('query_place_id');
    expect(url).toContain(
      encodeURIComponent('Tour Eiffel, Champ de Mars, Paris'),
    );
  });

  it('uses name+coords when no address and provider is not google', () => {
    const url = buildGoogleMapsCardUrl({
      name: 'Some Place',
      location: loc,
      externalProvider: 'osm',
    });
    expect(url).not.toContain('query_place_id');
    expect(url).toContain(encodeURIComponent('Some Place, 48.87,2.33'));
  });

  it('falls back to lat,lng when no name, no externalId, no googleMapsUri', () => {
    const url = buildGoogleMapsCardUrl({
      name: '',
      location: loc,
    });
    expect(url).toBe(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('48.87,2.33')}`,
    );
  });

  it('does not append query_place_id when provider is google but externalId is missing', () => {
    const url = buildGoogleMapsCardUrl({
      name: 'No ID Place',
      location: loc,
      externalProvider: 'google',
    });
    expect(url).not.toContain('query_place_id');
    expect(url).toContain(encodeURIComponent('No ID Place'));
  });
});
