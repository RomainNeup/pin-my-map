import { SavedPlaceDto } from "./saved.dto";
import { SavedPlaceDocument } from "./saved.entity";
import { TagMapper } from "src/tag/tag.mapper";
import { PlaceMapper } from "src/place/place.mapper";

export class SavedPlaceMapper {
    static toDto(savedPlace: SavedPlaceDocument): SavedPlaceDto {
        return {
            id: savedPlace._id.toHexString(),
            place: PlaceMapper.toDto(savedPlace.place),
            createdAt: savedPlace.createdAt,
            tags: TagMapper.toDtoList(savedPlace.tags),
            done: savedPlace.done,
            comment: savedPlace.comment,
            rating: savedPlace.rating
        };
    }

    static toDtoList(savedPlaces: SavedPlaceDocument[]): SavedPlaceDto[] {
        return savedPlaces.map((savedPlace) => this.toDto(savedPlace));
    }
}