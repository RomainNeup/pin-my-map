import { Controller, Get, HttpCode } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Private } from 'src/auth/auth.decorator';
import { User } from 'src/user/user.decorator';
import { GamificationProfileDto } from './gamification.dto';
import { GamificationMapper } from './gamification.mapper';
import { GamificationService } from './gamification.service';

@Controller('gamification')
@ApiTags('Gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Private()
  @Get('me')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: GamificationProfileDto,
    description: 'Current user gamification profile',
  })
  async me(@User('id') userId: string): Promise<GamificationProfileDto> {
    const profile = await this.gamificationService.getProfile(userId);
    return GamificationMapper.toProfileDto(profile);
  }
}
