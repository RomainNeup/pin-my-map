export interface EnrichmentPhoto {
  url: string;
  attribution?: string;
}

export interface EnrichmentReview {
  author: string;
  rating: number;
  text: string;
  time: number;
}

export interface EnrichmentOpeningHours {
  weekdayText: string[];
}

export interface EnrichmentResult {
  externalId: string;
  providerName: string;
  photos?: EnrichmentPhoto[];
  website?: string;
  phoneNumber?: string;
  openingHours?: EnrichmentOpeningHours;
  externalRating?: number;
  externalRatingCount?: number;
  reviews?: EnrichmentReview[];
  priceLevel?: number;
  types?: string[];
  fetchedAt: Date;
}

export interface EnrichmentQuery {
  name: string;
  location: [number, number]; // [lng, lat]
  address?: string;
}

export interface EnrichmentProvider {
  readonly name: string;
  isAvailable(): boolean;
  lookup(query: EnrichmentQuery): Promise<EnrichmentResult | null>;
  fetchById?(externalId: string): Promise<EnrichmentResult | null>;
}

export const ENRICHMENT_PROVIDERS = 'ENRICHMENT_PROVIDERS';
