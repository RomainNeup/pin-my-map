import { Module } from '@nestjs/common';
import { EnrichmentService } from './enrichment.service';
import { GooglePlacesProvider } from './providers/google-places.provider';
import { OsmProvider } from './providers/osm.provider';
import { ENRICHMENT_PROVIDERS } from './enrichment.types';

@Module({
  providers: [
    GooglePlacesProvider,
    OsmProvider,
    {
      provide: ENRICHMENT_PROVIDERS,
      // Chain: Google (if configured) → OSM
      useFactory: (google: GooglePlacesProvider, osm: OsmProvider) => [
        google,
        osm,
      ],
      inject: [GooglePlacesProvider, OsmProvider],
    },
    EnrichmentService,
  ],
  exports: [EnrichmentService],
})
export class EnrichmentModule {}
