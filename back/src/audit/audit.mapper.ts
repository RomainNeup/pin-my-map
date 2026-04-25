import { populatedRefId } from 'src/common/populated-ref';
import { AuditLogDto } from './audit.dto';
import { AuditLogDocument } from './audit.entity';

type PopulatedActor = { name?: string; email?: string } | null;

export class AuditMapper {
  static toDto(entity: AuditLogDocument): AuditLogDto {
    const actor = entity.actor as unknown;
    const actorId = populatedRefId(actor);
    let actorName: string | undefined;
    let actorEmail: string | undefined;
    if (actor && typeof actor === 'object' && 'name' in (actor as object)) {
      const populated = actor as PopulatedActor;
      actorName = populated?.name;
      actorEmail = populated?.email;
    }

    return {
      id: (entity._id as { toHexString: () => string }).toHexString(),
      actorId,
      actorName,
      actorEmail,
      action: entity.action,
      targetType: entity.targetType,
      targetId: entity.targetId,
      before: entity.before,
      after: entity.after,
      meta: entity.meta,
      createdAt:
        (entity as unknown as { createdAt: Date }).createdAt?.toISOString?.() ??
        '',
    };
  }

  static toDtoList(entities: AuditLogDocument[]): AuditLogDto[] {
    return entities.map((e) => this.toDto(e));
  }
}
