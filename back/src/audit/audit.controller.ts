import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Admin } from 'src/auth/auth.decorator';
import { AuditLogDto } from './audit.dto';
import { AuditService } from './audit.service';

@Controller('audit')
@ApiTags('Audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Admin()
  @Get()
  @HttpCode(200)
  @ApiResponse({ status: 200, type: [AuditLogDto] })
  async list(
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('actor') actor?: string,
    @Query('limit') limit?: string,
  ): Promise<AuditLogDto[]> {
    return this.auditService.list({
      action,
      targetType,
      actor,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
