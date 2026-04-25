import { Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Private } from 'src/auth/auth.decorator';
import { User } from 'src/user/user.decorator';
import { FollowStatsDto, FollowUserDto } from './follow.dto';
import { FollowService } from './follow.service';

@Controller('follow')
@ApiTags('Follow')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Private()
  @Post(':userId')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: FollowStatsDto })
  async follow(
    @User('id') me: string,
    @Param('userId') userId: string,
  ): Promise<FollowStatsDto> {
    return this.followService.follow(me, userId);
  }

  @Private()
  @Delete(':userId')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: FollowStatsDto })
  async unfollow(
    @User('id') me: string,
    @Param('userId') userId: string,
  ): Promise<FollowStatsDto> {
    return this.followService.unfollow(me, userId);
  }

  @Private()
  @Get('me/following')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: [FollowUserDto] })
  async myFollowing(@User('id') me: string): Promise<FollowUserDto[]> {
    return this.followService.listFollowing(me);
  }

  @Private()
  @Get('me/followers')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: [FollowUserDto] })
  async myFollowers(@User('id') me: string): Promise<FollowUserDto[]> {
    return this.followService.listFollowers(me);
  }

  @Private()
  @Get(':userId/stats')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: FollowStatsDto })
  async stats(
    @User('id') me: string,
    @Param('userId') userId: string,
  ): Promise<FollowStatsDto> {
    return this.followService.getStats(me, userId);
  }
}
