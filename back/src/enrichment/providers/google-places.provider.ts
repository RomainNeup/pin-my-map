import { Injectable, Logger } from '@nestjs/common';
import {
  EnrichmentProvider,
  EnrichmentQuery,
  EnrichmentResult,
  SocialLinks,
} from '../enrichment.types';

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const DETAILS_URL = 'https://places.googleapis.com/v1/places';
const PHOTO_URL = 'https://places.googleapis.com/v1';

const FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'websiteUri',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'googleMapsUri',
  'rating',
  'userRatingCount',
  'priceLevel',
  'types',
  'regularOpeningHours',
  'photos',
  'reviews',
  'businessStatus',
  'reservations',
].join(',');

interface GooglePlace {
  id: string;
  displayName?: { text?: string };
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string | number;
  types?: string[];
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  photos?: { name: string; authorAttributions?: { displayName?: string }[] }[];
  reviews?: {
    authorAttribution?: { displayName?: string };
    rating?: number;
    text?: { text?: string };
    publishTime?: string;
  }[];
  businessStatus?: string;
  reservations?: { uri?: string }[];
}

function extractGoogleSocialLinks(website?: string): SocialLinks | undefined {
  if (!website) return undefined;
  const links: SocialLinks = {};
  if (website.includes('instagram.com')) links.instagram = website;
  else if (website.includes('facebook.com')) links.facebook = website;
  else if (website.includes('twitter.com')) links.twitter = website;
  else if (website.includes('tiktok.com')) links.tiktok = website;
  return Object.keys(links).length > 0 ? links : undefined;
}

@Injectable()
export class GooglePlacesProvider implements EnrichmentProvider {
  readonly name = 'google';
  private readonly logger = new Logger(GooglePlacesProvider.name);

  isAvailable(): boolean {
    return Boolean(process.env.GOOGLE_PLACES_API_KEY);
  }

  async lookup(query: EnrichmentQuery): Promise<EnrichmentResult | null> {
    if (!this.isAvailable()) {
      return null;
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY!;
    const [lng, lat] = query.location;

    try {
      const response = await fetch(SEARCH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': `places.${FIELD_MASK.split(',').join(',places.')}`,
        },
        body: JSON.stringify({
          textQuery: query.address
            ? `${query.name} ${query.address}`
            : query.name,
          locationBias: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: 500,
            },
          },
          maxResultCount: 1,
        }),
      });

      if (!response.ok) {
        this.logger.warn(
          `Google Places searchText failed: ${response.status} ${await response.text()}`,
        );
        return null;
      }

      const data = (await response.json()) as { places?: GooglePlace[] };
      const place = data.places?.[0];
      if (!place) {
        return null;
      }
      return this.toResult(place);
    } catch (err) {
      this.logger.error(`Google Places lookup failed`, err as Error);
      return null;
    }
  }

  async fetchById(externalId: string): Promise<EnrichmentResult | null> {
    if (!this.isAvailable()) {
      return null;
    }
    const apiKey = process.env.GOOGLE_PLACES_API_KEY!;

    try {
      const response = await fetch(`${DETAILS_URL}/${externalId}`, {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': FIELD_MASK,
        },
      });

      if (!response.ok) {
        this.logger.warn(
          `Google Places details failed: ${response.status} ${await response.text()}`,
        );
        return null;
      }

      const place = (await response.json()) as GooglePlace;
      return this.toResult(place);
    } catch (err) {
      this.logger.error(`Google Places fetchById failed`, err as Error);
      return null;
    }
  }

  private toResult(place: GooglePlace): EnrichmentResult {
    const priceLevel = this.normalizePriceLevel(place.priceLevel);
    const permanentlyClosed =
      place.businessStatus === 'CLOSED_PERMANENTLY' ? true : undefined;

    const reservationLinks = place.reservations
      ?.map((r) => r.uri)
      .filter((uri): uri is string => Boolean(uri));

    const socialLinks = extractGoogleSocialLinks(place.websiteUri);

    return {
      externalId: place.id,
      providerName: this.name,
      website: place.websiteUri,
      phoneNumber: place.internationalPhoneNumber ?? place.nationalPhoneNumber,
      googleMapsUri: place.googleMapsUri,
      externalRating: place.rating,
      externalRatingCount: place.userRatingCount,
      priceLevel,
      types: place.types,
      openingHours: place.regularOpeningHours?.weekdayDescriptions
        ? { weekdayText: place.regularOpeningHours.weekdayDescriptions }
        : undefined,
      // NOTE: API key is intentionally omitted from the persisted URL.
      // The PlaceController photo proxy re-attaches it server-side.
      photos: place.photos?.slice(0, 10).map((p) => ({
        url: `${PHOTO_URL}/${p.name}/media?maxWidthPx=1200`,
        attribution: p.authorAttributions?.[0]?.displayName,
      })),
      reviews: place.reviews?.slice(0, 5).map((r) => ({
        author: r.authorAttribution?.displayName ?? 'Anonymous',
        rating: r.rating ?? 0,
        text: r.text?.text ?? '',
        time: r.publishTime ? Date.parse(r.publishTime) : 0,
      })),
      permanentlyClosed,
      reservationLinks:
        reservationLinks && reservationLinks.length > 0
          ? reservationLinks
          : undefined,
      socialLinks,
      fetchedAt: new Date(),
    };
  }

  private normalizePriceLevel(
    priceLevel: string | number | undefined,
  ): number | undefined {
    if (priceLevel === undefined) return undefined;
    if (typeof priceLevel === 'number') return priceLevel;
    const map: Record<string, number> = {
      PRICE_LEVEL_FREE: 0,
      PRICE_LEVEL_INEXPENSIVE: 1,
      PRICE_LEVEL_MODERATE: 2,
      PRICE_LEVEL_EXPENSIVE: 3,
      PRICE_LEVEL_VERY_EXPENSIVE: 4,
    };
    return map[priceLevel];
  }
}
