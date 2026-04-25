import { Body, Controller, Get, HttpCode, Logger, Put } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Admin } from 'src/auth/auth.decorator';
import { AuditService } from 'src/audit/audit.service';
import {
  AppConfigDto,
  PublicAppConfigDto,
  UpdateAppConfigDto,
} from 'src/config/config.dto';
import { ConfigService } from 'src/config/config.service';
import { User } from 'src/user/user.decorator';

@Controller('config')
@ApiTags('Config')
export class ConfigController {
  private readonly logger = new Logger(ConfigController.name);

  constructor(
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  @Get('public')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: PublicAppConfigDto })
  async getPublic(): Promise<PublicAppConfigDto> {
    const cfg = await this.configService.get();
    return { registrationMode: cfg.registrationMode };
  }

  @Admin()
  @Get()
  @HttpCode(200)
  @ApiResponse({ status: 200, type: AppConfigDto })
  async get(): Promise<AppConfigDto> {
    return this.configService.get();
  }

  @Admin()
  @Put()
  @HttpCode(200)
  @ApiResponse({ status: 200, type: AppConfigDto })
  async update(
    @Body() body: UpdateAppConfigDto,
    @User('id') actorId: string,
  ): Promise<AppConfigDto> {
    const { before, after } = await this.configService.update(body);
    try {
      await this.auditService.log({
        actor: actorId,
        action: 'config.update',
        targetType: 'config',
        targetId: 'app',
        before: { ...before },
        after: { ...after },
      });
    } catch (err) {
      this.logger.warn(`audit log failed: ${(err as Error).message}`);
    }
    return after;
  }
}
