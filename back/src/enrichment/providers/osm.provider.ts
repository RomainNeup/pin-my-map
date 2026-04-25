import { Injectable, Logger } from '@nestjs/common';
import {
  Amenities,
  EnrichmentProvider,
  EnrichmentQuery,
  EnrichmentResult,
  SocialLinks,
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
  category?: string;
  display_name?: string;
  address?: Record<string, string>;
  extratags?: Record<string, string>;
}

interface WikipediaSummary {
  extract?: string;
  thumbnail?: { source: string };
}

// ── Wikipedia gating ─────────────────────────────────────────────────────────

/**
 * OSM categories where Wikipedia lookup makes sense (notable landmarks).
 * Any key:value pair that describes a public monument, attraction, etc.
 */
const WIKIPEDIA_WHITELIST_CATEGORIES = new Set([
  'tourism',
  'historic',
  'natural',
]);

const WIKIPEDIA_WHITELIST_TYPES = new Set([
  // tourism
  'museum',
  'attraction',
  'viewpoint',
  'gallery',
  'monument',
  'artwork',
  'theme_park',
  'zoo',
  'aquarium',
  // historic
  'castle',
  'ruins',
  'memorial',
  'archaeological_site',
  'fort',
  'wreck',
  'manor',
  'ship',
  // leisure
  'park',
  'garden',
  'nature_reserve',
  'stadium',
  // natural
  'peak',
  'beach',
  'cape',
  'cliff',
  'waterfall',
  'volcano',
  'spring',
  // building (religious/landmark)
  'cathedral',
  'church',
  'mosque',
  'synagogue',
  'temple',
  'chapel',
]);

const WIKIPEDIA_BLACKLIST_TYPES = new Set([
  'restaurant',
  'bar',
  'cafe',
  'pub',
  'fast_food',
  'food_court',
  'biergarten',
  'ice_cream',
  'nightclub',
  'fuel',
  'atm',
  'bank',
  'pharmacy',
  'hospital',
  'kindergarten',
  'school',
  'toilets',
  'parking',
]);

const WIKIPEDIA_BLACKLIST_CATEGORIES = new Set(['shop', 'office', 'craft']);

/**
 * Decide whether to attempt a Wikipedia lookup for a given Nominatim result.
 *
 * Priority:
 * 1. If OSM extratags.wikipedia or extratags.wikidata is present → ALWAYS fetch
 *    (the curated tag is a reliable mapping).
 * 2. If the category/type is blacklisted → skip.
 * 3. If the category is whitelisted OR the type is whitelisted → fetch.
 * 4. Otherwise → skip.
 *
 * Returns an object describing the decision and which title to use.
 */
function shouldFetchWikipedia(
  nominatim: NominatimResponse,
  name: string,
): { fetch: boolean; title: string; fromTag: boolean } {
  const extratags = nominatim.extratags ?? {};
  const category = nominatim.category ?? '';
  const type = nominatim.type ?? '';

  // Best signal: OSM curated tag
  const wikidataTag = extratags['wikipedia'] ?? extratags['wikidata'];
  if (wikidataTag) {
    // extratags.wikipedia is typically "en:Article_Title" — extract the title part
    const title = wikidataTag.includes(':')
      ? wikidataTag.split(':').slice(1).join(':')
      : name;
    return { fetch: true, title, fromTag: true };
  }

  // Blacklist wins
  if (
    WIKIPEDIA_BLACKLIST_CATEGORIES.has(category) ||
    WIKIPEDIA_BLACKLIST_TYPES.has(type)
  ) {
    return { fetch: false, title: name, fromTag: false };
  }

  // Whitelist
  if (
    WIKIPEDIA_WHITELIST_CATEGORIES.has(category) ||
    WIKIPEDIA_WHITELIST_TYPES.has(type)
  ) {
    return { fetch: true, title: name, fromTag: false };
  }

  return { fetch: false, title: name, fromTag: false };
}

// ── Social links helpers ─────────────────────────────────────────────────────

function extractSocialLinks(
  extratags: Record<string, string>,
  website?: string,
): SocialLinks | undefined {
  const links: SocialLinks = {};

  // OSM contact tags
  const insta = extratags['contact:instagram'] ?? extratags['instagram'];
  if (insta) links.instagram = normalizeUrl(insta);

  const fb = extratags['contact:facebook'] ?? extratags['facebook'];
  if (fb) links.facebook = normalizeUrl(fb);

  const tw = extratags['contact:twitter'] ?? extratags['twitter'];
  if (tw) links.twitter = normalizeUrl(tw);

  const tt = extratags['contact:tiktok'] ?? extratags['tiktok'];
  if (tt) links.tiktok = normalizeUrl(tt);

  // Derive from website domain heuristic
  if (website && !links.instagram && website.includes('instagram.com')) {
    links.instagram = website;
  }
  if (website && !links.facebook && website.includes('facebook.com')) {
    links.facebook = website;
  }
  if (website && !links.twitter && website.includes('twitter.com')) {
    links.twitter = website;
  }
  if (website && !links.tiktok && website.includes('tiktok.com')) {
    links.tiktok = website;
  }

  return Object.keys(links).length > 0 ? links : undefined;
}

function normalizeUrl(raw: string): string {
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `https://${raw}`;
}

// ── Amenities helpers ─────────────────────────────────────────────────────────

type YesNoOnly = 'yes' | 'no' | 'only';
type WheelchairVal = 'yes' | 'no' | 'limited';
type WifiVal = 'yes' | 'no' | 'wlan';

function parseYesNoOnly(val: string | undefined): YesNoOnly | undefined {
  if (!val) return undefined;
  const v = val.toLowerCase();
  if (v === 'yes' || v === 'only' || v === 'no') return v as YesNoOnly;
  return undefined;
}

function parseWheelchair(val: string | undefined): WheelchairVal | undefined {
  if (!val) return undefined;
  const v = val.toLowerCase();
  if (v === 'yes' || v === 'no' || v === 'limited') return v as WheelchairVal;
  return undefined;
}

function parseWifi(val: string | undefined): WifiVal | undefined {
  if (!val) return undefined;
  const v = val.toLowerCase();
  if (v === 'yes' || v === 'wlan' || v === 'wired') return 'wlan'; // wired → treat as yes
  if (v === 'no') return 'no';
  return undefined;
}

function extractAmenities(
  extratags: Record<string, string>,
): Amenities | undefined {
  const a: Amenities = {};

  const wheelchair = parseWheelchair(extratags['wheelchair']);
  if (wheelchair) a.wheelchair = wheelchair;

  const outdoor = extratags['outdoor_seating'];
  if (outdoor) a.outdoorSeating = outdoor === 'yes';

  const wifi = parseWifi(extratags['internet_access']);
  if (wifi) a.wifi = wifi;

  const veg = parseYesNoOnly(extratags['diet:vegetarian']);
  if (veg) a.dietVegetarian = veg;

  const vegan = parseYesNoOnly(extratags['diet:vegan']);
  if (vegan) a.dietVegan = vegan;

  const gf = parseYesNoOnly(extratags['diet:gluten_free']);
  if (gf) a.dietGlutenFree = gf;

  return Object.keys(a).length > 0 ? a : undefined;
}

// ── OSM disused detection ─────────────────────────────────────────────────────

function isOsmDisused(extratags: Record<string, string>): boolean {
  // disused=yes or any disused:* key present
  if (extratags['disused'] === 'yes') return true;
  return Object.keys(extratags).some((k) => k.startsWith('disused:'));
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

      const wikiDecision = shouldFetchWikipedia(nominatim, query.name);
      let wikiSummary: WikipediaSummary | null = null;

      if (wikiDecision.fetch) {
        wikiSummary = await this.fetchWikipedia(wikiDecision.title);
        if (wikiDecision.fromTag) {
          this.logger.debug(
            `Wikipedia fetched via OSM tag for "${query.name}"`,
          );
        }
      } else {
        this.logger.debug(
          `Wikipedia skipped for "${query.name}" (category=${nominatim.category}, type=${nominatim.type})`,
        );
      }

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

    const website = extratags['website'];
    const socialLinks = extractSocialLinks(extratags, website);
    const amenities = extractAmenities(extratags);
    const permanentlyClosed = isOsmDisused(extratags) || undefined;

    return {
      externalId,
      providerName: this.name,
      website,
      phoneNumber: extratags['phone'],
      openingHours,
      types: types.length > 0 ? types : undefined,
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      photos: photos.length > 0 ? photos : undefined,
      description: wiki?.extract,
      socialLinks,
      amenities,
      permanentlyClosed: permanentlyClosed ? true : undefined,
      fetchedAt: new Date(),
    };
  }
}
