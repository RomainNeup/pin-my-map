import { populatedRefId } from 'src/common/populated-ref';
import { PlaceMapper } from 'src/place/place.mapper';
import { PlaceDocument } from 'src/place/place.entity';
import { SuggestionChangesDto, SuggestionDto } from './suggestion.dto';
import { PlaceSuggestionDocument } from './suggestion.entity';

type PopulatedUserRef =
  | {
      name?: string;
      email?: string;
    }
  | null
  | undefined;

function changesToDto(
  changes: PlaceSuggestionDocument['changes'],
): SuggestionChangesDto {
  const dto: SuggestionChangesDto = {};
  if (changes.name !== undefined) dto.name = changes.name;
  if (changes.description !== undefined) dto.description = changes.description;
  if (changes.address !== undefined) dto.address = changes.address;
  if (changes.image !== undefined) dto.image = changes.image;
  if (Array.isArray(changes.location) && changes.location.length === 2) {
    dto.location = { lng: changes.location[0], lat: changes.location[1] };
  }
  return dto;
}

export class SuggestionMapper {
  static toDto(entity: PlaceSuggestionDocument): SuggestionDto {
    const user = entity.user as unknown as PopulatedUserRef;
    const submitterName =
      user && typeof user === 'object' && 'name' in user
        ? user.name
        : undefined;
    const submitterEmail =
      user && typeof user === 'object' && 'email' in user
        ? user.email
        : undefined;

    const placeRef = entity.place as unknown;
    let placeDto;
    let placeId: string;
    if (
      placeRef &&
      typeof placeRef === 'object' &&
      placeRef !== null &&
      'name' in (placeRef as object) &&
      'location' in (placeRef as object)
    ) {
      placeDto = PlaceMapper.toDto(placeRef as PlaceDocument);
      placeId = placeDto.id;
    } else {
      placeId = populatedRefId(placeRef);
    }

    const timestamps = entity as unknown as {
      createdAt: Date;
      updatedAt: Date;
    };

    return {
      id: (entity._id as { toHexString: () => string }).toHexString(),
      status: entity.status,
      submitterId: populatedRefId(entity.user),
      submitterName,
      submitterEmail,
      place: placeDto,
      placeId,
      changes: changesToDto(entity.changes),
      note: entity.note,
      reviewedBy: entity.reviewedBy
        ? populatedRefId(entity.reviewedBy)
        : undefined,
      reviewedAt: entity.reviewedAt
        ? new Date(entity.reviewedAt).toISOString()
        : undefined,
      reviewReason: entity.reviewReason,
      createdAt: timestamps.createdAt?.toISOString?.() ?? '',
      updatedAt: timestamps.updatedAt?.toISOString?.() ?? '',
    };
  }

  static toDtoList(entities: PlaceSuggestionDocument[]): SuggestionDto[] {
    return entities.map((e) => this.toDto(e));
  }
}
