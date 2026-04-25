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
});
