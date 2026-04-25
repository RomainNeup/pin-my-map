import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

function toObjectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException('Invalid id');
  }
  return new Types.ObjectId(id);
}
import { AuditLog } from './audit.entity';
import { AuditLogDto } from './audit.dto';
import { AuditMapper } from './audit.mapper';

export interface AuditEntry {
  actor: string;
  action: string;
  targetType: string;
  targetId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface AuditFilters {
  action?: string;
  targetType?: string;
  actor?: string;
  limit?: number;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLog>,
  ) {}

  async log(entry: AuditEntry): Promise<void> {
    await this.auditModel.create({
      actor: toObjectId(entry.actor),
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      before: entry.before,
      after: entry.after,
      meta: entry.meta,
    });
  }

  async list(filters: AuditFilters = {}): Promise<AuditLogDto[]> {
    const query: Record<string, unknown> = {};
    if (filters.action) query.action = filters.action;
    if (filters.targetType) query.targetType = filters.targetType;
    if (filters.actor) query.actor = toObjectId(filters.actor);

    const cursor = this.auditModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit && filters.limit > 0 ? filters.limit : 200)
      .populate('actor', 'name email');

    const results = await cursor.exec();
    return AuditMapper.toDtoList(results);
  }
}
