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
import { CreatePlaceRequestDto, PlaceDto } from './place.dto';
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
    @Body() placeDto: CreatePlaceRequestDto,
  ): Promise<PlaceDto> {
    return await this.placeService.create(placeDto, userId);
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

  @Private()
  @Get(':id')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: PlaceDto,
    description: 'Returns a specific place by ID.',
  })
  @ApiResponse({
    status: 404,
    description: 'Place with the specified ID not found.',
  })
  async getPlace(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<PlaceDto> {
    return await this.placeService.findOne(id);
  }

  @Private()
  @Get(':id/photo/:idx')
  @ApiResponse({
    status: 200,
    description: 'Streams the enrichment photo binary.',
  })
  @ApiResponse({ status: 404, description: 'Photo not found.' })
  async getPhoto(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('idx', ParseIntPipe) idx: number,
    @Res() res: Response,
  ): Promise<void> {
    if (idx < 0 || idx > 50) {
      throw new BadRequestException('Invalid photo index');
    }
    const url = await this.placeService.findPhotoUrl(id, idx);
    try {
      const upstream = await fetch(url, { redirect: 'follow' });
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

  @Admin()
  @Put(':id')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: PlaceDto,
    description: 'Place successfully updated.',
  })
  @ApiResponse({
    status: 404,
    description: 'Place with the specified ID not found.',
  })
  async updatePlace(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() placeDto: CreatePlaceRequestDto,
  ): Promise<PlaceDto> {
    return await this.placeService.update(id, placeDto);
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
}
