import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Admin, Private } from 'src/auth/auth.decorator';
import { AuditService } from 'src/audit/audit.service';
import { ParseObjectIdPipe } from 'src/common/parse-object-id.pipe';
import { User } from 'src/user/user.decorator';
import {
  PublicMapSettingsDto,
  SlugAvailabilityDto,
  UpdatePublicMapDto,
  UpdateUserRoleDto,
  UserProfileDto,
} from 'src/user/user.dto';
import { UserService } from 'src/user/user.service';

@Controller('user')
@ApiTags('User')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private userService: UserService,
    private auditService: AuditService,
  ) {}

  @Admin()
  @Get()
  @HttpCode(200)
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, type: [UserProfileDto] })
  async list(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<UserProfileDto[]> {
    const parsedLimit = limit !== undefined ? Number(limit) : undefined;
    const parsedOffset = offset !== undefined ? Number(offset) : undefined;
    return this.userService.listProfiles({
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      offset: Number.isFinite(parsedOffset) ? parsedOffset : undefined,
    });
  }

  @Private()
  @Get('me/public-map')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: PublicMapSettingsDto })
  async getMyPublicMap(
    @User('id') userId: string,
  ): Promise<PublicMapSettingsDto> {
    return this.userService.getPublicMapSettings(userId);
  }

  @Private()
  @Patch('me/public-map')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: PublicMapSettingsDto })
  async updateMyPublicMap(
    @User('id') userId: string,
    @Body() body: UpdatePublicMapDto,
  ): Promise<PublicMapSettingsDto> {
    return this.userService.updatePublicMap(
      userId,
      body.isPublic,
      body.publicSlug,
    );
  }

  @Private()
  @Post('me/public-map/rotate-token')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: PublicMapSettingsDto })
  async rotatePublicToken(
    @User('id') userId: string,
  ): Promise<PublicMapSettingsDto> {
    return this.userService.rotatePublicToken(userId);
  }

  @Private()
  @Get('check-slug')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: SlugAvailabilityDto })
  async checkSlug(
    @Query('slug') slug: string,
    @User('id') userId: string,
  ): Promise<SlugAvailabilityDto> {
    if (!slug) {
      throw new BadRequestException('slug query param required');
    }
    const available = await this.userService.isSlugAvailable(slug, userId);
    return { available };
  }

  @Admin()
  @Patch(':id/role')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: UserProfileDto })
  async updateRole(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: UpdateUserRoleDto,
    @User('id') actorId: string,
  ): Promise<UserProfileDto> {
    const before = await this.userService.findProfile(id);
    const updated = await this.userService.updateRole(id, body.role);
    try {
      await this.auditService.log({
        actor: actorId,
        action: 'user.role.update',
        targetType: 'user',
        targetId: id,
        before: { role: before.role },
        after: { role: updated.role },
      });
    } catch (err) {
      this.logger.warn(`audit log failed: ${(err as Error).message}`);
    }
    return updated;
  }

  @Admin()
  @Delete(':id')
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'User deleted' })
  async remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @User('id') actorId: string,
  ): Promise<void> {
    if (id === actorId) {
      throw new BadRequestException('Cannot delete your own account');
    }
    const before = await this.userService.findProfile(id);
    await this.userService.remove(id);
    try {
      await this.auditService.log({
        actor: actorId,
        action: 'user.delete',
        targetType: 'user',
        targetId: id,
        before: { name: before.name, email: before.email, role: before.role },
      });
    } catch (err) {
      this.logger.warn(`audit log failed: ${(err as Error).message}`);
    }
  }
}
