import { PlaceDto } from "./place.dto";
import { PlaceDocument } from "./place.entity";

export class PlaceMapper {
    static toDto(entity: PlaceDocument): PlaceDto {
        return {
            id: entity._id.toHexString(),
            name: entity.name,
            location: {
                lng: entity.location[0],
                lat: entity.location[1]
            },
            address: entity.address,
            description: entity.description,
            image: entity.image
        };
    }

    static toDtoList(entities: (PlaceDocument)[]): PlaceDto[] {
        return entities.map(entity => this.toDto(entity));
    }
}