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

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
}

export interface Amenities {
  wheelchair?: 'yes' | 'no' | 'limited';
  outdoorSeating?: boolean;
  wifi?: 'yes' | 'no' | 'wlan';
  dietVegetarian?: 'yes' | 'no' | 'only';
  dietVegan?: 'yes' | 'no' | 'only';
  dietGlutenFree?: 'yes' | 'no' | 'only';
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
  googleMapsUri?: string;
  /** Optional description/excerpt (e.g. from Wikipedia). Used when the Place has no description. */
  description?: string;
  /** Social media links extracted from OSM extratags or website heuristics. */
  socialLinks?: SocialLinks;
  /** Accessibility and amenity flags from OSM extratags. */
  amenities?: Amenities;
  /** True when the place is permanently closed (from Google businessStatus or OSM disused tags). */
  permanentlyClosed?: boolean;
  /** Reservation links (e.g. from Google Places API). */
  reservationLinks?: string[];
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

// ── Conflict tracking ──────────────────────────────────────────────────────

export type EnrichmentField =
  | 'name'
  | 'address'
  | 'phoneNumber'
  | 'website'
  | 'priceLevel'
  | 'externalRating'
  | 'permanentlyClosed'
  | 'description';

export interface EnrichmentConflict {
  field: EnrichmentField;
  values: Array<{ provider: string; value: unknown }>;
}

/**
 * The result of a full enrichment run: the merged result plus any
 * inter-provider conflicts detected and the names of providers that ran.
 */
export interface EnrichmentRunResult {
  merged: EnrichmentResult;
  conflicts: EnrichmentConflict[];
  ranBy: string[];
}
