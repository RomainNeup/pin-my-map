import { TagDto, TagDtoLight } from "./tag.dto";
import { Tag, TagDocument } from "./tag.entity";

export class TagMapper {
    static toDto(entity: TagDocument): TagDto {
        return {
            id: entity._id.toHexString(),
            name: entity.name,
            emoji: entity.emoji
        };
    }
    static toDtoList(entities: TagDocument[]): TagDto[] {
        return entities.map(entity => this.toDto(entity));
    }

    static toDtoLight(entity: TagDocument): TagDtoLight {
        return {
            name: entity.name,
            emoji: entity.emoji
        };
    }

    static toDtoLightList(entities: TagDocument[]): TagDtoLight[] {
        return entities.map(entity => this.toDtoLight(entity));
    }
}