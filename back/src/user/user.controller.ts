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
  ChangePasswordDto,
  DeleteMeDto,
  InviteUserDto,
  InviteUserResponseDto,
  PublicMapSettingsDto,
  PublicUserDto,
  RejectUserRequestDto,
  SlugAvailabilityDto,
  SuspendUserRequestDto,
  UpdateMeDto,
  UpdatePublicMapDto,
  UpdateUserRoleDto,
  UserProfileDto,
} from 'src/user/user.dto';
import { USER_STATUSES, UserStatus } from 'src/user/user.entity';
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
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: USER_STATUSES })
  @ApiResponse({ status: 200, type: [UserProfileDto] })
  async list(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
  ): Promise<UserProfileDto[]> {
    const parsedLimit = limit !== undefined ? Number(limit) : undefined;
    const parsedOffset = offset !== undefined ? Number(offset) : undefined;
    let parsedStatus: UserStatus | undefined;
    if (status !== undefined && status !== '') {
      if (!USER_STATUSES.includes(status as UserStatus)) {
        throw new BadRequestException('Invalid status filter');
      }
      parsedStatus = status as UserStatus;
    }
    return this.userService.listProfiles({
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      offset: Number.isFinite(parsedOffset) ? parsedOffset : undefined,
      q,
      status: parsedStatus,
    });
  }

  @Private()
  @Get('search')
  @HttpCode(200)
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiResponse({ status: 200, type: [PublicUserDto] })
  async search(
    @Query('q') q: string,
    @User('id') userId: string,
  ): Promise<PublicUserDto[]> {
    if (!q) throw new BadRequestException('q query param required');
    return this.userService.search(q, userId);
  }

  @Admin()
  @Get('pending')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: [UserProfileDto] })
  async listPending(): Promise<UserProfileDto[]> {
    return this.userService.listPending();
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
  @Patch('me')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: UserProfileDto })
  async updateMe(
    @User('id') userId: string,
    @Body() body: UpdateMeDto,
  ): Promise<UserProfileDto> {
    return this.userService.updateMe(userId, body);
  }

  @Private()
  @Post('me/change-password')
  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Password changed' })
  async changePassword(
    @User('id') userId: string,
    @Body() body: ChangePasswordDto,
  ): Promise<void> {
    await this.userService.changePassword(
      userId,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Private()
  @Delete('me')
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Account soft-deleted' })
  async deleteMe(
    @User('id') userId: string,
    @Body() body: DeleteMeDto,
  ): Promise<void> {
    await this.userService.softDeleteMe(userId, body.password);
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
  @Post()
  @HttpCode(201)
  @ApiResponse({ status: 201, type: InviteUserResponseDto })
  async invite(
    @Body() body: InviteUserDto,
    @User('id') actorId: string,
  ): Promise<InviteUserResponseDto> {
    const { user, tempPassword } = await this.userService.invite(
      body.name,
      body.email,
      body.role,
    );
    try {
      await this.auditService.log({
        actor: actorId,
        action: 'user.create',
        targetType: 'user',
        targetId: user.id,
        after: { name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      this.logger.warn(`audit log failed: ${(err as Error).message}`);
    }
    // TODO(post-Wave-2): switch to mailer-driven password reset; drop tempPassword from response.
    return { user, tempPassword };
  }

  @Admin()
  @Post(':id/approve')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: UserProfileDto })
  async approve(
    @Param('id', ParseObjectIdPipe) id: string,
    @User('id') actorId: string,
  ): Promise<UserProfileDto> {
    const before = await this.userService.findProfile(id);
    const updated = await this.userService.approve(id);
    try {
      await this.auditService.log({
        actor: actorId,
        action: 'user.approve',
        targetType: 'user',
        targetId: id,
        before: { status: before.status },
        after: { status: updated.status },
      });
    } catch (err) {
      this.logger.warn(`audit log failed: ${(err as Error).message}`);
    }
    return updated;
  }

  @Admin()
  @Post(':id/reject')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: UserProfileDto })
  async reject(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: RejectUserRequestDto,
    @User('id') actorId: string,
  ): Promise<UserProfileDto> {
    const before = await this.userService.findProfile(id);
    const updated = await this.userService.reject(id, body.reason);
    try {
      await this.auditService.log({
        actor: actorId,
        action: 'user.reject',
        targetType: 'user',
        targetId: id,
        before: { status: before.status },
        after: {
          status: updated.status,
          rejectionReason: updated.rejectionReason,
        },
      });
    } catch (err) {
      this.logger.warn(`audit log failed: ${(err as Error).message}`);
    }
    return updated;
  }

  @Admin()
  @Post(':id/suspend')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: UserProfileDto })
  async suspend(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: SuspendUserRequestDto,
    @User('id') actorId: string,
  ): Promise<UserProfileDto> {
    if (id === actorId) {
      throw new BadRequestException('Cannot suspend your own account');
    }
    const before = await this.userService.findProfile(id);
    const updated = await this.userService.suspend(id, body.reason);
    try {
      await this.auditService.log({
        actor: actorId,
        action: 'user.suspend',
        targetType: 'user',
        targetId: id,
        before: { status: before.status },
        after: {
          status: updated.status,
          rejectionReason: updated.rejectionReason,
        },
      });
    } catch (err) {
      this.logger.warn(`audit log failed: ${(err as Error).message}`);
    }
    return updated;
  }

  @Admin()
  @Post(':id/unsuspend')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: UserProfileDto })
  async unsuspend(
    @Param('id', ParseObjectIdPipe) id: string,
    @User('id') actorId: string,
  ): Promise<UserProfileDto> {
    const before = await this.userService.findProfile(id);
    const updated = await this.userService.unsuspend(id);
    try {
      await this.auditService.log({
        actor: actorId,
        action: 'user.unsuspend',
        targetType: 'user',
        targetId: id,
        before: { status: before.status },
        after: { status: updated.status },
      });
    } catch (err) {
      this.logger.warn(`audit log failed: ${(err as Error).message}`);
    }
    return updated;
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
