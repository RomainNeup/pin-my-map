import { detectConflicts, mergeEnrichments } from './enrichment.service';
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

// ── detectConflicts ──────────────────────────────────────────────────────────

describe('detectConflicts', () => {
  it('returns no conflicts when both providers have the same website (trailing slash)', () => {
    const r1 = makeResult({
      providerName: 'google',
      website: 'https://example.com/',
    });
    const r2 = makeResult({
      providerName: 'mapbox',
      website: 'https://example.com',
    });
    const conflicts = detectConflicts([
      { provider: 'google', result: r1 },
      { provider: 'mapbox', result: r2 },
    ]);
    expect(conflicts).toHaveLength(0);
  });

  it('detects a website conflict when URLs differ beyond trailing slash', () => {
    const r1 = makeResult({
      providerName: 'google',
      website: 'https://google.com',
    });
    const r2 = makeResult({
      providerName: 'mapbox',
      website: 'https://different.com',
    });
    const conflicts = detectConflicts([
      { provider: 'google', result: r1 },
      { provider: 'mapbox', result: r2 },
    ]);
    const c = conflicts.find((x) => x.field === 'website');
    expect(c).toBeDefined();
    expect(c!.values).toHaveLength(2);
    expect(c!.values.map((v) => v.provider)).toEqual(['google', 'mapbox']);
  });

  it('detects a phone conflict when digits differ', () => {
    const r1 = makeResult({
      providerName: 'google',
      phoneNumber: '+1 (800) 123-4567',
    });
    const r2 = makeResult({
      providerName: 'osm',
      phoneNumber: '+1 800 999 0000',
    });
    const conflicts = detectConflicts([
      { provider: 'google', result: r1 },
      { provider: 'osm', result: r2 },
    ]);
    expect(conflicts.find((c) => c.field === 'phoneNumber')).toBeDefined();
  });

  it('does NOT conflict when phone normalises to same digits', () => {
    const r1 = makeResult({
      providerName: 'google',
      phoneNumber: '+1-800-123-4567',
    });
    const r2 = makeResult({ providerName: 'osm', phoneNumber: '+18001234567' });
    const conflicts = detectConflicts([
      { provider: 'google', result: r1 },
      { provider: 'osm', result: r2 },
    ]);
    expect(conflicts.find((c) => c.field === 'phoneNumber')).toBeUndefined();
  });

  it('detects externalRating conflict when difference > 0.3', () => {
    const r1 = makeResult({ providerName: 'google', externalRating: 4.5 });
    const r2 = makeResult({ providerName: 'mapbox', externalRating: 4.0 });
    const conflicts = detectConflicts([
      { provider: 'google', result: r1 },
      { provider: 'mapbox', result: r2 },
    ]);
    expect(conflicts.find((c) => c.field === 'externalRating')).toBeDefined();
  });

  it('does NOT conflict when externalRating difference <= 0.3', () => {
    const r1 = makeResult({ providerName: 'google', externalRating: 4.5 });
    const r2 = makeResult({ providerName: 'mapbox', externalRating: 4.3 });
    const conflicts = detectConflicts([
      { provider: 'google', result: r1 },
      { provider: 'mapbox', result: r2 },
    ]);
    expect(conflicts.find((c) => c.field === 'externalRating')).toBeUndefined();
  });

  it('detects permanentlyClosed conflict when one says true and other false', () => {
    const r1 = makeResult({ providerName: 'google', permanentlyClosed: true });
    const r2 = makeResult({ providerName: 'osm', permanentlyClosed: false });
    const conflicts = detectConflicts([
      { provider: 'google', result: r1 },
      { provider: 'osm', result: r2 },
    ]);
    expect(
      conflicts.find((c) => c.field === 'permanentlyClosed'),
    ).toBeDefined();
  });

  it('does NOT conflict when only one provider supplies permanentlyClosed', () => {
    const r1 = makeResult({ providerName: 'google', permanentlyClosed: true });
    const r2 = makeResult({
      providerName: 'osm',
      permanentlyClosed: undefined,
    });
    const conflicts = detectConflicts([
      { provider: 'google', result: r1 },
      { provider: 'osm', result: r2 },
    ]);
    expect(
      conflicts.find((c) => c.field === 'permanentlyClosed'),
    ).toBeUndefined();
  });

  it('does NOT create a conflict when only one provider has a value for a field', () => {
    const r1 = makeResult({
      providerName: 'google',
      website: 'https://example.com',
    });
    const r2 = makeResult({ providerName: 'osm', website: undefined });
    const conflicts = detectConflicts([
      { provider: 'google', result: r1 },
      { provider: 'osm', result: r2 },
    ]);
    expect(conflicts).toHaveLength(0);
  });

  it('array fields (types) do NOT generate conflicts', () => {
    const r1 = makeResult({ providerName: 'google', types: ['restaurant'] });
    const r2 = makeResult({ providerName: 'osm', types: ['cafe'] });
    const conflicts = detectConflicts([
      { provider: 'google', result: r1 },
      { provider: 'osm', result: r2 },
    ]);
    // types is not in SCALAR_FIELDS so should not appear
    expect(
      conflicts.find((c) => c.field === ('types' as never)),
    ).toBeUndefined();
  });

  it('captures all non-primary values in conflict.values', () => {
    const r1 = makeResult({ providerName: 'google', externalRating: 4.8 });
    const r2 = makeResult({ providerName: 'mapbox', externalRating: 4.0 });
    const r3 = makeResult({ providerName: 'osm', externalRating: 4.1 });
    const conflicts = detectConflicts([
      { provider: 'google', result: r1 },
      { provider: 'mapbox', result: r2 },
      { provider: 'osm', result: r3 },
    ]);
    const c = conflicts.find((x) => x.field === 'externalRating');
    expect(c).toBeDefined();
    expect(c!.values).toHaveLength(3);
  });

  it('detects description conflict (case-insensitive)', () => {
    const r1 = makeResult({
      providerName: 'google',
      description: 'A great café',
    });
    const r2 = makeResult({
      providerName: 'osm',
      description: 'A different place',
    });
    const conflicts = detectConflicts([
      { provider: 'google', result: r1 },
      { provider: 'osm', result: r2 },
    ]);
    expect(conflicts.find((c) => c.field === 'description')).toBeDefined();
  });

  it('returns empty array when only one provider runs', () => {
    const r1 = makeResult({
      providerName: 'google',
      website: 'https://example.com',
    });
    const conflicts = detectConflicts([{ provider: 'google', result: r1 }]);
    expect(conflicts).toHaveLength(0);
  });
});
