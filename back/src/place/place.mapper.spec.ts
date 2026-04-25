import { buildPlaceSummary } from './place.mapper';
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
