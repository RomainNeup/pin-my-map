import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ENRICHMENT_PROVIDERS,
  EnrichmentProvider,
  EnrichmentQuery,
  EnrichmentResult,
} from './enrichment.types';

/**
 * Merges two EnrichmentResult objects by filling in missing fields from the
 * secondary result. Primary fields always win; secondary only fills gaps.
 *
 * Special cases:
 * - `types` are union-merged (secondary types appended, deduplicated).
 * - `photos` from primary always win over secondary.
 * - `description` from secondary is used only if primary has none.
 * - `providerName` becomes "primary+secondary" when both contributed.
 */
export function mergeEnrichments(
  primary: EnrichmentResult,
  secondary: EnrichmentResult,
): EnrichmentResult {
  const merged: EnrichmentResult = { ...primary };

  // Fill scalar gaps from secondary
  if (!merged.website && secondary.website) merged.website = secondary.website;
  if (!merged.phoneNumber && secondary.phoneNumber)
    merged.phoneNumber = secondary.phoneNumber;
  if (!merged.openingHours && secondary.openingHours)
    merged.openingHours = secondary.openingHours;
  if (!merged.externalRating && secondary.externalRating)
    merged.externalRating = secondary.externalRating;
  if (!merged.externalRatingCount && secondary.externalRatingCount)
    merged.externalRatingCount = secondary.externalRatingCount;
  if (merged.priceLevel === undefined && secondary.priceLevel !== undefined)
    merged.priceLevel = secondary.priceLevel;
  if (!merged.googleMapsUri && secondary.googleMapsUri)
    merged.googleMapsUri = secondary.googleMapsUri;
  if (!merged.description && secondary.description)
    merged.description = secondary.description;

  // Photos: primary wins, secondary only contributes when primary has none
  if (
    (!merged.photos || merged.photos.length === 0) &&
    secondary.photos?.length
  ) {
    merged.photos = secondary.photos;
  }

  // Types: union-merge, deduplicating
  if (secondary.types?.length) {
    const baseTypes = merged.types ?? [];
    const extra = secondary.types.filter((t) => !baseTypes.includes(t));
    if (extra.length > 0) {
      merged.types = [...baseTypes, ...extra];
    }
  }

  // Social links: merge, primary wins per-field
  if (secondary.socialLinks) {
    const base = merged.socialLinks ?? {};
    merged.socialLinks = {
      instagram: base.instagram ?? secondary.socialLinks.instagram,
      facebook: base.facebook ?? secondary.socialLinks.facebook,
      twitter: base.twitter ?? secondary.socialLinks.twitter,
      tiktok: base.tiktok ?? secondary.socialLinks.tiktok,
    };
    // Remove undefined keys so the object stays clean
    Object.keys(merged.socialLinks).forEach((k) => {
      if (
        merged.socialLinks![k as keyof typeof merged.socialLinks] === undefined
      ) {
        delete merged.socialLinks![k as keyof typeof merged.socialLinks];
      }
    });
    if (Object.keys(merged.socialLinks).length === 0) delete merged.socialLinks;
  }

  // Amenities: merge, primary wins per-field
  if (secondary.amenities && !merged.amenities) {
    merged.amenities = secondary.amenities;
  }

  // permanentlyClosed: true wins (if either flags it)
  if (secondary.permanentlyClosed && !merged.permanentlyClosed) {
    merged.permanentlyClosed = true;
  }

  // reservationLinks: primary wins
  if (!merged.reservationLinks && secondary.reservationLinks) {
    merged.reservationLinks = secondary.reservationLinks;
  }

  // Mark providerName to reflect both providers contributed
  merged.providerName = `${primary.providerName}+${secondary.providerName}`;

  return merged;
}

@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);

  constructor(
    @Inject(ENRICHMENT_PROVIDERS)
    private readonly providers: EnrichmentProvider[],
  ) {}

  /**
   * Tries all configured providers in order, merges results from successive
   * providers to fill missing fields. Returns null when no provider yields
   * a result.
   */
  async enrich(query: EnrichmentQuery): Promise<EnrichmentResult | null> {
    let merged: EnrichmentResult | null = null;

    for (const provider of this.providers) {
      if (!provider.isAvailable()) continue;
      try {
        const result = await provider.lookup(query);
        if (!result) continue;

        if (!merged) {
          merged = result;
        } else {
          merged = mergeEnrichments(merged, result);
        }
      } catch (err) {
        this.logger.warn(
          `Provider ${provider.name} threw during lookup: ${(err as Error).message}`,
        );
      }
    }

    return merged;
  }

  async refresh(
    providerName: string,
    externalId: string,
  ): Promise<EnrichmentResult | null> {
    // When providerName is a chain like "google+osm", refresh using the first
    // named provider that supports fetchById.
    const firstName = providerName.split('+')[0];
    const provider = this.providers.find((p) => p.name === firstName);
    if (!provider || !provider.isAvailable() || !provider.fetchById) {
      return null;
    }
    try {
      return await provider.fetchById(externalId);
    } catch (err) {
      this.logger.warn(
        `Provider ${provider.name} threw during refresh: ${(err as Error).message}`,
      );
      return null;
    }
  }
}
