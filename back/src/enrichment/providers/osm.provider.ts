import { Injectable, Logger } from '@nestjs/common';
import {
  EnrichmentProvider,
  EnrichmentQuery,
  EnrichmentResult,
} from '../enrichment.types';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const WIKIPEDIA_API = 'https://en.wikipedia.org/api/rest_v1/page/summary';
const USER_AGENT = 'pin-my-map/1.0 (https://github.com/pin-my-map)';

// Nominatim policy: at most 1 request/second. We serialize calls with >=1100ms gaps.
let nominatimChain: Promise<void> = Promise.resolve();
const NOMINATIM_DELAY_MS = 1100;

/** Reset the throttle chain — only intended for use in tests. */
export function _resetNominatimChain(): void {
  nominatimChain = Promise.resolve();
}

function nominatimThrottle<T>(fn: () => Promise<T>): Promise<T> {
  const result = nominatimChain.then(fn);
  nominatimChain = result
    .then(() => sleep(NOMINATIM_DELAY_MS))
    .catch(() => sleep(NOMINATIM_DELAY_MS));
  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface NominatimResponse {
  place_id?: number;
  type?: string;
  display_name?: string;
  address?: Record<string, string>;
  extratags?: Record<string, string>;
}

interface WikipediaSummary {
  extract?: string;
  thumbnail?: { source: string };
}

@Injectable()
export class OsmProvider implements EnrichmentProvider {
  readonly name = 'osm';
  private readonly logger = new Logger(OsmProvider.name);

  isAvailable(): boolean {
    return true; // No API key required
  }

  async lookup(query: EnrichmentQuery): Promise<EnrichmentResult | null> {
    const [lng, lat] = query.location;

    try {
      const nominatim = await nominatimThrottle(() =>
        this.fetchNominatim(lat, lng),
      );

      if (!nominatim) {
        return null;
      }

      const wikiSummary = await this.fetchWikipedia(query.name);

      return this.toResult(nominatim, wikiSummary, lat, lng);
    } catch (err) {
      this.logger.error(`OSM lookup failed`, err as Error);
      return null;
    }
  }

  private async fetchNominatim(
    lat: number,
    lng: number,
  ): Promise<NominatimResponse | null> {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('zoom', '18');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('extratags', '1');

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      this.logger.warn(
        `Nominatim reverse failed: ${response.status} ${await response.text()}`,
      );
      return null;
    }

    return (await response.json()) as NominatimResponse;
  }

  private async fetchWikipedia(name: string): Promise<WikipediaSummary | null> {
    try {
      const url = `${WIKIPEDIA_API}/${encodeURIComponent(name)}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        this.logger.warn(`Wikipedia summary failed: ${response.status}`);
        return null;
      }

      return (await response.json()) as WikipediaSummary;
    } catch (err) {
      this.logger.warn(`Wikipedia fetch failed: ${(err as Error).message}`);
      return null;
    }
  }

  private toResult(
    nominatim: NominatimResponse,
    wiki: WikipediaSummary | null,
    lat: number,
    lng: number,
  ): EnrichmentResult {
    const extratags = nominatim.extratags ?? {};

    const types: string[] = [];
    if (nominatim.type) {
      types.push(nominatim.type);
    }
    if (extratags['cuisine']) {
      types.push(`cuisine:${extratags['cuisine']}`);
    }

    const openingHoursText = extratags['opening_hours'];
    const openingHours = openingHoursText
      ? { weekdayText: [openingHoursText] }
      : undefined;

    const photos: { url: string; attribution: string }[] = [];
    if (wiki?.thumbnail?.source) {
      photos.push({ url: wiki.thumbnail.source, attribution: 'Wikipedia' });
    }

    // Build a stable external ID from lat/lng (rounded to 6 decimals)
    const externalId = `osm:${lat.toFixed(6)},${lng.toFixed(6)}`;

    return {
      externalId,
      providerName: this.name,
      website: extratags['website'],
      phoneNumber: extratags['phone'],
      openingHours,
      types: types.length > 0 ? types : undefined,
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      photos: photos.length > 0 ? photos : undefined,
      description: wiki?.extract,
      fetchedAt: new Date(),
    };
  }
}
