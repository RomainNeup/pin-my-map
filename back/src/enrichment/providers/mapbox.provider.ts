import { Injectable, Logger } from '@nestjs/common';
import {
  EnrichmentProvider,
  EnrichmentQuery,
  EnrichmentResult,
} from '../enrichment.types';

const REVERSE_GEOCODE_URL = 'https://api.mapbox.com/search/geocode/v6/reverse';

interface MapboxFeatureProperties {
  name?: string;
  full_address?: string;
  poi_category?: string[];
  poi_category_ids?: string[];
  feature_type?: string;
  coordinates?: { longitude?: number; latitude?: number };
  context?: Record<string, unknown>;
}

interface MapboxFeature {
  id: string;
  type: string;
  properties: MapboxFeatureProperties;
}

interface MapboxGeocodeResponse {
  features?: MapboxFeature[];
}

@Injectable()
export class MapboxProvider implements EnrichmentProvider {
  readonly name = 'mapbox';
  private readonly logger = new Logger(MapboxProvider.name);

  isAvailable(): boolean {
    return Boolean(process.env.MAPBOX_ACCESS_TOKEN);
  }

  async lookup(query: EnrichmentQuery): Promise<EnrichmentResult | null> {
    if (!this.isAvailable()) {
      return null;
    }

    const accessToken = process.env.MAPBOX_ACCESS_TOKEN!;
    const [lng, lat] = query.location;

    try {
      const url = new URL(REVERSE_GEOCODE_URL);
      url.searchParams.set('longitude', String(lng));
      url.searchParams.set('latitude', String(lat));
      url.searchParams.set('access_token', accessToken);

      const response = await fetch(url.toString());

      if (!response.ok) {
        this.logger.warn(
          `Mapbox reverse geocode failed: ${response.status} ${await response.text()}`,
        );
        return null;
      }

      const data = (await response.json()) as MapboxGeocodeResponse;
      const feature = data.features?.[0];

      if (!feature) {
        return null;
      }

      return this.toResult(feature, lat, lng);
    } catch (err) {
      this.logger.error(`Mapbox lookup failed`, err as Error);
      return null;
    }
  }

  private toResult(
    feature: MapboxFeature,
    lat: number,
    lng: number,
  ): EnrichmentResult {
    const props = feature.properties;

    const types =
      props.poi_category_ids && props.poi_category_ids.length > 0
        ? props.poi_category_ids
        : undefined;

    return {
      externalId: `mapbox:${feature.id}`,
      providerName: this.name,
      types,
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      fetchedAt: new Date(),
    };
  }
}
