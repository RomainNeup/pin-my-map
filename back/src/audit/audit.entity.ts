import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  actor: Types.ObjectId;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  targetType: string;

  @Prop({ required: false })
  targetId?: string;

  @Prop({ type: Object, required: false })
  before?: Record<string, unknown>;

  @Prop({ type: Object, required: false })
  after?: Record<string, unknown>;

  @Prop({ type: Object, required: false })
  meta?: Record<string, unknown>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
