import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ENRICHMENT_PROVIDERS,
  EnrichmentProvider,
  EnrichmentQuery,
  EnrichmentResult,
} from './enrichment.types';

@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);

  constructor(
    @Inject(ENRICHMENT_PROVIDERS)
    private readonly providers: EnrichmentProvider[],
  ) {}

  async enrich(query: EnrichmentQuery): Promise<EnrichmentResult | null> {
    for (const provider of this.providers) {
      if (!provider.isAvailable()) continue;
      try {
        const result = await provider.lookup(query);
        if (result) {
          return result;
        }
      } catch (err) {
        this.logger.warn(
          `Provider ${provider.name} threw during lookup: ${(err as Error).message}`,
        );
      }
    }
    return null;
  }

  async refresh(
    providerName: string,
    externalId: string,
  ): Promise<EnrichmentResult | null> {
    const provider = this.providers.find((p) => p.name === providerName);
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
