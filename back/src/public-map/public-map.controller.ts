import { Controller, Get, HttpCode, Param, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Private } from 'src/auth/auth.decorator';
import { User } from 'src/user/user.decorator';
import { PublicMapService } from './public-map.service';
import {
  PublicMapDto,
  PublicMapStatsDto,
  PublicMapSummaryDto,
  PublicSavedPlaceDto,
} from './public-map.dto';

@Controller('public')
@ApiTags('Public Map')
export class PublicMapController {
  constructor(private readonly publicMapService: PublicMapService) {}

  @Get('discover')
  @HttpCode(200)
  @ApiQuery({ name: 'q', required: false })
  @ApiResponse({ status: 200, type: [PublicMapSummaryDto] })
  async discover(@Query('q') q?: string): Promise<PublicMapSummaryDto[]> {
    return this.publicMapService.discover(q);
  }

  @Private()
  @Get('following')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: [PublicMapSummaryDto] })
  async getFollowingPublicMaps(
    @User('id') userId: string,
  ): Promise<PublicMapSummaryDto[]> {
    return this.publicMapService.getFollowingPublicMaps(userId);
  }

  @Get('slug/:slug/stats')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: PublicMapStatsDto })
  async getStatsBySlug(
    @Param('slug') slug: string,
  ): Promise<PublicMapStatsDto> {
    return this.publicMapService.getStatsBySlug(slug);
  }

  @Get('slug/:slug')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: PublicMapDto })
  async getBySlug(@Param('slug') slug: string): Promise<PublicMapDto> {
    return this.publicMapService.getBySlug(slug);
  }

  @Get('token/:token')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: PublicMapDto })
  async getByToken(@Param('token') token: string): Promise<PublicMapDto> {
    return this.publicMapService.getByToken(token);
  }

  @Get('slug/:slug/place/:savedPlaceId')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: PublicSavedPlaceDto })
  async getSavedPlaceForSlug(
    @Param('slug') slug: string,
    @Param('savedPlaceId') savedPlaceId: string,
  ): Promise<PublicSavedPlaceDto> {
    return this.publicMapService.getSavedPlaceForSlug(slug, savedPlaceId);
  }

  @Get('token/:token/place/:savedPlaceId')
  @HttpCode(200)
  @ApiResponse({ status: 200, type: PublicSavedPlaceDto })
  async getSavedPlaceForToken(
    @Param('token') token: string,
    @Param('savedPlaceId') savedPlaceId: string,
  ): Promise<PublicSavedPlaceDto> {
    return this.publicMapService.getSavedPlaceForToken(token, savedPlaceId);
  }
}
