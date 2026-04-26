import { mergeEnrichments } from './enrichment.service';
import { EnrichmentResult } from './enrichment.types';

function makeResult(
  overrides: Partial<EnrichmentResult> = {},
): EnrichmentResult {
  return {
    externalId: 'test-id',
    providerName: 'google',
    fetchedAt: new Date(),
    ...overrides,
  };
}

describe('mergeEnrichments', () => {
  it('primary fields always win over secondary', () => {
    const primary = makeResult({
      website: 'https://primary.com',
      phoneNumber: '+1',
    });
    const secondary = makeResult({
      website: 'https://secondary.com',
      phoneNumber: '+2',
    });

    const merged = mergeEnrichments(primary, secondary);

    expect(merged.website).toBe('https://primary.com');
    expect(merged.phoneNumber).toBe('+1');
  });

  it('fills missing fields from secondary', () => {
    const primary = makeResult({ website: undefined });
    const secondary = makeResult({
      website: 'https://secondary.com',
      phoneNumber: '+2',
    });

    const merged = mergeEnrichments(primary, secondary);

    expect(merged.website).toBe('https://secondary.com');
    expect(merged.phoneNumber).toBe('+2');
  });

  it('primary photos win over secondary', () => {
    const primaryPhotos = [{ url: 'https://primary.com/photo.jpg' }];
    const secondaryPhotos = [
      { url: 'https://wiki.org/thumb.jpg', attribution: 'Wikipedia' },
    ];

    const primary = makeResult({ photos: primaryPhotos });
    const secondary = makeResult({ photos: secondaryPhotos });

    const merged = mergeEnrichments(primary, secondary);

    expect(merged.photos).toEqual(primaryPhotos);
  });

  it('secondary photos fill when primary has no photos', () => {
    const secondaryPhotos = [
      { url: 'https://wiki.org/thumb.jpg', attribution: 'Wikipedia' },
    ];

    const primary = makeResult({ photos: undefined });
    const secondary = makeResult({ photos: secondaryPhotos });

    const merged = mergeEnrichments(primary, secondary);

    expect(merged.photos).toEqual(secondaryPhotos);
  });

  it('union-merges types, deduplicated', () => {
    const primary = makeResult({ types: ['restaurant', 'food'] });
    const secondary = makeResult({ types: ['food', 'cuisine:french'] });

    const merged = mergeEnrichments(primary, secondary);

    expect(merged.types).toEqual(['restaurant', 'food', 'cuisine:french']);
  });

  it('description from secondary fills when primary has none', () => {
    const primary = makeResult({ description: undefined });
    const secondary = makeResult({ description: 'A Wikipedia extract.' });

    const merged = mergeEnrichments(primary, secondary);

    expect(merged.description).toBe('A Wikipedia extract.');
  });

  it('primary description wins over secondary', () => {
    const primary = makeResult({ description: 'Primary description.' });
    const secondary = makeResult({ description: 'Wiki extract.' });

    const merged = mergeEnrichments(primary, secondary);

    expect(merged.description).toBe('Primary description.');
  });

  it('sets providerName to "primary+secondary"', () => {
    const primary = makeResult({ providerName: 'google' });
    const secondary = makeResult({ providerName: 'osm' });

    const merged = mergeEnrichments(primary, secondary);

    expect(merged.providerName).toBe('google+osm');
  });

  // ── Provider chain including Mapbox ──────────────────────────────────────────

  it('three-way merge: google+mapbox+osm providerName reflects all providers', () => {
    const google = makeResult({
      providerName: 'google',
      types: ['restaurant'],
    });
    const mapbox = makeResult({
      providerName: 'mapbox',
      types: ['food_and_drink'],
    });
    const osm = makeResult({
      providerName: 'osm',
      description: 'A Wikipedia extract.',
    });

    // Simulate the EnrichmentService chain
    const step1 = mergeEnrichments(google, mapbox);
    const step2 = mergeEnrichments(step1, osm);

    expect(step2.providerName).toBe('google+mapbox+osm');
  });

  it('mapbox types fill when google has none (google+mapbox slot)', () => {
    const google = makeResult({
      providerName: 'google',
      types: undefined,
      website: 'https://example.com',
    });
    const mapbox = makeResult({
      providerName: 'mapbox',
      types: ['landmark', 'tourist_attraction'],
    });

    const merged = mergeEnrichments(google, mapbox);

    expect(merged.types).toEqual(['landmark', 'tourist_attraction']);
    expect(merged.website).toBe('https://example.com'); // google field preserved
  });

  it('google types win over mapbox types, mapbox appends missing ones', () => {
    const google = makeResult({
      providerName: 'google',
      types: ['restaurant'],
    });
    const mapbox = makeResult({
      providerName: 'mapbox',
      types: ['restaurant', 'food_and_drink'],
    });

    const merged = mergeEnrichments(google, mapbox);

    // 'restaurant' deduplicated, 'food_and_drink' appended
    expect(merged.types).toEqual(['restaurant', 'food_and_drink']);
  });

  it('mapbox+osm providerName when google is absent', () => {
    const mapbox = makeResult({
      providerName: 'mapbox',
      types: ['landmark'],
    });
    const osm = makeResult({
      providerName: 'osm',
      description: 'A Wikipedia extract.',
      types: ['museum'],
    });

    const merged = mergeEnrichments(mapbox, osm);

    expect(merged.providerName).toBe('mapbox+osm');
    expect(merged.types).toEqual(['landmark', 'museum']);
    expect(merged.description).toBe('A Wikipedia extract.');
  });
});
