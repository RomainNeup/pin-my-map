import { Module } from '@nestjs/common';
import { EnrichmentService } from './enrichment.service';
import { GooglePlacesProvider } from './providers/google-places.provider';
import { MapboxProvider } from './providers/mapbox.provider';
import { OsmProvider } from './providers/osm.provider';
import { ENRICHMENT_PROVIDERS } from './enrichment.types';

@Module({
  providers: [
    GooglePlacesProvider,
    MapboxProvider,
    OsmProvider,
    {
      provide: ENRICHMENT_PROVIDERS,
      // Chain: Google (richest) → Mapbox (categories + address) → OSM (amenities + Wikipedia)
      useFactory: (
        google: GooglePlacesProvider,
        mapbox: MapboxProvider,
        osm: OsmProvider,
      ) => [google, mapbox, osm],
      inject: [GooglePlacesProvider, MapboxProvider, OsmProvider],
    },
    EnrichmentService,
  ],
  exports: [EnrichmentService],
})
export class EnrichmentModule {}
