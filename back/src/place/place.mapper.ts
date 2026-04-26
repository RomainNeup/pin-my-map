import {
  EnrichmentConflictDto,
  PlaceDto,
  PlaceEnrichmentDto,
} from './place.dto';
import { PlaceDocument, PlaceEnrichment } from './place.entity';
import { EnrichmentConflict } from 'src/enrichment/enrichment.types';

export class PlaceMapper {
  static toDto(
    entity: PlaceDocument,
    saveCount?: number,
    isAdmin = false,
  ): PlaceDto {
    const id = entity._id.toHexString();
    const conflicts: EnrichmentConflict[] = entity.enrichmentConflicts ?? [];
    return {
      id,
      name: entity.name,
      location: {
        lng: entity.location[0],
        lat: entity.location[1],
      },
      address: entity.address,
      description: entity.description,
      image: entity.image,
      externalId: entity.externalId,
      externalProvider: entity.externalProvider,
      enrichment: entity.enrichment
        ? this.enrichmentToDto(entity.enrichment, id)
        : undefined,
      enrichedAt: entity.enrichedAt,
      createdBy: entity.createdBy?.toHexString(),
      summary: buildPlaceSummary(entity.enrichment),
      moderationStatus: entity.moderationStatus,
      rejectionReason: entity.rejectionReason,
      permanentlyClosed: entity.permanentlyClosed || undefined,
      permanentlyClosedAt: entity.permanentlyClosedAt?.toISOString(),
      saveCount,
      hasUnresolvedConflicts: conflicts.length > 0,
      enrichmentConflicts: isAdmin ? conflicts : undefined,
    };
  }

  static toDtoList(entities: PlaceDocument[], isAdmin = false): PlaceDto[] {
    return entities.map((entity) => this.toDto(entity, undefined, isAdmin));
  }

  static toConflictDto(c: EnrichmentConflict): EnrichmentConflictDto {
    return { field: c.field, values: c.values };
  }

  private static enrichmentToDto(
    e: PlaceEnrichment,
    placeId: string,
  ): PlaceEnrichmentDto {
    const base = process.env.PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';
    return {
      externalId: e.externalId,
      providerName: e.providerName,
      photos: e.photos?.map((p, idx) => ({
        url: `${base}/place/${placeId}/photo/${idx}`,
        attribution: p.attribution,
      })),
      website: e.website,
      phoneNumber: e.phoneNumber,
      openingHours: e.openingHours,
      externalRating: e.externalRating,
      externalRatingCount: e.externalRatingCount,
      reviews: e.reviews,
      priceLevel: e.priceLevel,
      types: e.types,
      googleMapsUri: e.googleMapsUri,
      socialLinks: e.socialLinks,
      amenities: e.amenities as PlaceEnrichmentDto['amenities'],
      reservationLinks: e.reservationLinks,
      fetchedAt: e.fetchedAt,
    };
  }
}

// ── Google Maps card URL helper ───────────────────────────────────────────────

export interface GoogleMapsCardUrlParams {
  name: string;
  address?: string;
  location: { lat: number; lng: number };
  externalId?: string;
  externalProvider?: string;
  /** When set, this is already a real card URL — return it as-is. */
  googleMapsUri?: string;
}

/**
 * Build the best possible Google Maps URL for a place.
 *
 * Priority:
 * 1. `googleMapsUri` from enrichment (real card URL, already resolved).
 * 2. `query_place_id` when provider is "google" (opens the exact place card).
 * 3. Name+address query when provider is mapbox/osm (Google's heuristic).
 * 4. Plain lat,lng fallback.
 */
export function buildGoogleMapsCardUrl(p: GoogleMapsCardUrlParams): string {
  if (p.googleMapsUri) return p.googleMapsUri;

  const base = 'https://www.google.com/maps/search/?api=1';
  const latLng = `${p.location.lat},${p.location.lng}`;

  if (p.externalProvider === 'google' && p.externalId) {
    const q = encodeURIComponent(latLng);
    return `${base}&query=${q}&query_place_id=${encodeURIComponent(p.externalId)}`;
  }

  if (p.name) {
    const queryText = p.address
      ? `${p.name}, ${p.address}`
      : `${p.name}, ${latLng}`;
    return `${base}&query=${encodeURIComponent(queryText)}`;
  }

  return `${base}&query=${encodeURIComponent(latLng)}`;
}

const PRICE_SYMBOLS = ['$', '$$', '$$$', '$$$$'];

/**
 * Build a human-readable one-liner from a place's enrichment data.
 *
 * Segments (each optional, joined with " • "):
 *   - priceLevel ($..$$$$)
 *   - rating ★ + count "(1.2k)" / "(320)"
 *
 * Returns undefined when there is nothing meaningful to show. Pure helper —
 * no time-of-day awareness ("Open now" is computed on the front).
 */
export function buildPlaceSummary(
  enrichment: PlaceEnrichment | undefined,
): string | undefined {
  if (!enrichment) return undefined;

  const segments: string[] = [];

  const price = formatPriceLevel(enrichment.priceLevel);
  if (price) segments.push(price);

  const rating = formatRating(
    enrichment.externalRating,
    enrichment.externalRatingCount,
  );
  if (rating) segments.push(rating);

  if (segments.length === 0) return undefined;
  return segments.join(' • ');
}

function formatPriceLevel(priceLevel: number | undefined): string | undefined {
  if (priceLevel === undefined || priceLevel === null) return undefined;
  if (!Number.isFinite(priceLevel)) return undefined;
  const idx = Math.round(priceLevel) - 1;
  return PRICE_SYMBOLS[idx];
}

function formatRating(
  rating: number | undefined,
  count: number | undefined,
): string | undefined {
  if (rating === undefined || rating === null || !Number.isFinite(rating)) {
    return undefined;
  }
  const ratingText = `${rating.toFixed(1)} ★`;
  if (
    count === undefined ||
    count === null ||
    !Number.isFinite(count) ||
    count <= 0
  ) {
    return ratingText;
  }
  return `${ratingText} (${formatCount(count)})`;
}

function formatCount(count: number): string {
  if (count < 1000) return String(Math.round(count));
  const thousands = count / 1000;
  // 1.2k for < 10k, 12k for >= 10k
  if (thousands < 10) return `${thousands.toFixed(1)}k`;
  return `${Math.round(thousands)}k`;
}
