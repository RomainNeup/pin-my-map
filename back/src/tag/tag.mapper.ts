import { TagDto } from './tag.dto';
import { TagDocument } from './tag.entity';

export class TagMapper {
  static toDto(entity: TagDocument): TagDto {
    return {
      id: entity._id.toHexString(),
      name: entity.name,
      emoji: entity.emoji,
    };
  }
  static toDtoList(entities: TagDocument[]): TagDto[] {
    return entities.map((entity) => this.toDto(entity));
  }
}
