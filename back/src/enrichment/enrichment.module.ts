import { Module } from '@nestjs/common';
import { EnrichmentService } from './enrichment.service';
import { GooglePlacesProvider } from './providers/google-places.provider';
import { ENRICHMENT_PROVIDERS } from './enrichment.types';

@Module({
  providers: [
    GooglePlacesProvider,
    {
      provide: ENRICHMENT_PROVIDERS,
      useFactory: (google: GooglePlacesProvider) => [google],
      inject: [GooglePlacesProvider],
    },
    EnrichmentService,
  ],
  exports: [EnrichmentService],
})
export class EnrichmentModule {}
