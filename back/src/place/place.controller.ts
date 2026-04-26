import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Admin, Private } from 'src/auth/auth.decorator';
import { ParseObjectIdPipe } from 'src/common/parse-object-id.pipe';
import { PlaceService } from './place.service';
import {
  BulkEnrichDto,
  BulkEnrichSummaryDto,
  CreatePlaceRequestDto,
  DismissConflictDto,
  PlaceClosedDto,
  PlaceConflictsPageDto,
  PlaceDto,
  RejectPlaceDto,
  ResolveConflictDto,
} from './place.dto';
import { User } from 'src/user/user.decorator';

@Controller('place')
@ApiTags('Place')
export class PlaceController {
  private readonly logger = new Logger(PlaceController.name);

  constructor(private readonly placeService: PlaceService) {}

  @Private()
  @Post()
  @HttpCode(201)
  @ApiResponse({
    status: 201,
    type: PlaceDto,
    description: 'Place successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Failed to create place.' })
  async createPlace(
    @User('id') userId: string,
    @User('role') role: 'user' | 'admin' | undefined,
    @Body() placeDto: CreatePlaceRequestDto,
  ): Promise<PlaceDto> {
    return await this.placeService.create(placeDto, userId, role);
  }

  @Private()
  @Get()
  @HttpCode(200)
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({
    status: 200,
    type: [PlaceDto],
    description: 'Returns all available places.',
  })
  async getPlaces(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<PlaceDto[]> {
    const parsedLimit = limit !== undefined ? Number(limit) : undefined;
    const parsedOffset = offset !== undefined ? Number(offset) : undefined;
    return await this.placeService.findAll({
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      offset: Number.isFinite(parsedOffset) ? parsedOffset : undefined,
    });
  }

  @Private()
  @Get('search')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: [PlaceDto],
    description: 'Returns all available places.',
  })
  async searchPlaces(@Query('q') query: string): Promise<PlaceDto[]> {
    return await this.placeService.search(query);
  }

  @Admin()
  @Get('pending')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: [PlaceDto],
    description: 'Returns places awaiting moderation.',
  })
  async listPending(): Promise<PlaceDto[]> {
    return await this.placeService.listPending();
  }

  @Admin()
  @Get('conflicts')
  @HttpCode(200)
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({
    status: 200,
    type: PlaceConflictsPageDto,
    description:
      'Paginated list of places with unresolved enrichment conflicts.',
  })
  async listConflicts(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<PlaceConflictsPageDto> {
    const parsedLimit = limit !== undefined ? Number(limit) : undefined;
    const parsedOffset = offset !== undefined ? Number(offset) : undefined;
    return await this.placeService.listConflicts({
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      offset: Number.isFinite(parsedOffset) ? parsedOffset : undefined,
    });
  }

  @Admin()
  @Post('bulk-enrich')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: BulkEnrichSummaryDto,
    description: 'Bulk enrichment summary.',
  })
  async bulkEnrich(
    @Body() dto: BulkEnrichDto,
    @User('id') adminId: string,
  ): Promise<BulkEnrichSummaryDto> {
    return await this.placeService.bulkEnrich(dto, adminId);
  }

  @Admin()
  @Post(':id/approve')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: PlaceDto,
    description: 'Place approved.',
  })
  async approvePlace(
    @Param('id', ParseObjectIdPipe) id: string,
    @User('id') adminId: string,
  ): Promise<PlaceDto> {
    return await this.placeService.approve(id, adminId);
  }

  @Admin()
  @Post(':id/reject')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: PlaceDto,
    description: 'Place rejected.',
  })
  async rejectPlace(
    @Param('id', ParseObjectIdPipe) id: string,
    @User('id') adminId: string,
    @Body() body: RejectPlaceDto,
  ): Promise<PlaceDto> {
    return await this.placeService.reject(id, adminId, body?.reason);
  }

  @Private()
  @Get(':id')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: PlaceDto,
    description: 'Returns a specific place by ID (includes saveCount).',
  })
  @ApiResponse({
    status: 404,
    description: 'Place with the specified ID not found.',
  })
  async getPlace(
    @Param('id', ParseObjectIdPipe) id: string,
    @User('id') userId: string | undefined,
    @User('role') role: 'user' | 'admin' | undefined,
  ): Promise<PlaceDto> {
    return await this.placeService.findOneWithStats(
      id,
      userId ? { id: userId, role } : undefined,
    );
  }

  @Admin()
  @Post(':id/closed')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: PlaceDto,
    description: 'Sets or unsets the permanently-closed flag.',
  })
  async setPlaceClosed(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: PlaceClosedDto,
    @User('id') adminId: string,
  ): Promise<PlaceDto> {
    return await this.placeService.setPermanentlyClosed(id, body, adminId);
  }

  @Private()
  @Get(':id/photo/:idx')
  @ApiResponse({
    status: 200,
    description: 'Streams the enrichment photo binary.',
  })
  @ApiResponse({
    status: 204,
    description: 'Place exists but has no photo at the given index.',
  })
  @ApiResponse({ status: 404, description: 'Place not found.' })
  async getPhoto(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('idx', ParseIntPipe) idx: number,
    @Res() res: Response,
  ): Promise<void> {
    if (idx < 0 || idx > 50) {
      throw new BadRequestException('Invalid photo index');
    }
    const url = await this.placeService.findPhotoUrl(id, idx);
    if (url === null) {
      res.status(204).end();
      return;
    }
    try {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      const headers: Record<string, string> = {};
      if (apiKey && url.startsWith('https://places.googleapis.com/')) {
        headers['X-Goog-Api-Key'] = apiKey;
      }
      const upstream = await fetch(url, { redirect: 'follow', headers });
      if (!upstream.ok || !upstream.body) {
        res.status(upstream.status || 502).end();
        return;
      }
      const contentType =
        upstream.headers.get('content-type') ?? 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.end(buffer);
    } catch (err) {
      this.logger.warn(`photo proxy failed: ${(err as Error).message}`);
      res.status(502).end();
    }
  }

  @Private()
  @Put(':id')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: PlaceDto,
    description: 'Place successfully updated.',
  })
  @ApiResponse({
    status: 403,
    description: 'Caller is neither the creator nor an admin.',
  })
  @ApiResponse({
    status: 404,
    description: 'Place with the specified ID not found.',
  })
  async updatePlace(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() placeDto: CreatePlaceRequestDto,
    @User('id') userId: string,
    @User('role') role: string,
  ): Promise<PlaceDto> {
    return await this.placeService.update(id, placeDto, { id: userId, role });
  }

  @Admin()
  @Post(':id/refresh-enrichment')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: PlaceDto,
    description: 'Place enrichment refreshed.',
  })
  async refreshEnrichment(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<PlaceDto> {
    return await this.placeService.refreshEnrichment(id);
  }

  @Admin()
  @Post(':id/resolve-conflict')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: PlaceDto,
    description: 'Conflict resolved: chosen value applied to enrichment.',
  })
  async resolveConflict(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ResolveConflictDto,
    @User('id') adminId: string,
  ): Promise<PlaceDto> {
    return await this.placeService.resolveConflict(id, dto, adminId);
  }

  @Admin()
  @Post(':id/dismiss-conflict')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: PlaceDto,
    description: 'Conflict dismissed without changing the enrichment value.',
  })
  async dismissConflict(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: DismissConflictDto,
    @User('id') adminId: string,
  ): Promise<PlaceDto> {
    return await this.placeService.dismissConflict(id, dto, adminId);
  }
}
