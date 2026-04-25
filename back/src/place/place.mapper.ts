import { PlaceDto, PlaceEnrichmentDto } from './place.dto';
import { PlaceDocument, PlaceEnrichment } from './place.entity';

export class PlaceMapper {
  static toDto(entity: PlaceDocument): PlaceDto {
    const id = entity._id.toHexString();
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
    };
  }

  static toDtoList(entities: PlaceDocument[]): PlaceDto[] {
    return entities.map((entity) => this.toDto(entity));
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
      fetchedAt: e.fetchedAt,
    };
  }
}
