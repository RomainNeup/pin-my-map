import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'Audit Log' })
export class AuditLogDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  actorId: string;
  @ApiProperty({ required: false })
  actorName?: string;
  @ApiProperty({ required: false })
  actorEmail?: string;
  @ApiProperty()
  action: string;
  @ApiProperty()
  targetType: string;
  @ApiProperty({ required: false })
  targetId?: string;
  @ApiProperty({ required: false, type: Object })
  before?: Record<string, unknown>;
  @ApiProperty({ required: false, type: Object })
  after?: Record<string, unknown>;
  @ApiProperty({ required: false, type: Object })
  meta?: Record<string, unknown>;
  @ApiProperty()
  createdAt: string;
}
