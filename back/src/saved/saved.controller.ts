import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Private } from 'src/auth/auth.decorator';
import { SavedPlaceService } from './saved.service';
import {
  CommentSavedPlaceDto,
  PlaceIsSavedDto,
  RatingSavedPlaceDto,
  SavedPlaceDto,
} from './saved.dto';
import { User } from 'src/user/user.decorator';

@Controller('saved')
@ApiTags('Saved place')
export class SavedController {
  constructor(private readonly savedPlaceService: SavedPlaceService) {}

  @Private()
  @Get()
  @HttpCode(200)
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({
    name: 'tagIds',
    required: false,
    type: String,
    description: 'Comma-separated tag ids to filter by (OR semantics)',
  })
  @ApiQuery({
    name: 'done',
    required: false,
    type: Boolean,
    description:
      'Filter by done status. true = only done places, false = only todo places. Omit to return all.',
  })
  @ApiResponse({
    status: 200,
    type: [SavedPlaceDto],
    description: 'Return saved places, newest first',
  })
  async getSavedPlaces(
    @User('id') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('tagIds') tagIds?: string,
    @Query('done') done?: string,
  ): Promise<SavedPlaceDto[]> {
    const parsedLimit = limit ? Number(limit) : undefined;
    const parsedOffset = offset ? Number(offset) : undefined;
    const parsedTagIds = tagIds
      ? tagIds
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    const parsedDone =
      done === 'true' ? true : done === 'false' ? false : undefined;

    return await this.savedPlaceService.findAll(userId, {
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      offset: Number.isFinite(parsedOffset) ? parsedOffset : undefined,
      tagIds: parsedTagIds,
      done: parsedDone,
    });
  }

  @Private()
  @Get('export.csv')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'Stream the user saved places as a CSV file',
  })
  async exportCsv(
    @User('id') userId: string,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.savedPlaceService.exportCsv(userId);
    const date = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pin-my-map-saved-${date}.csv"`,
    });
    res.send(csv);
  }

  @Private()
  @Post(':id')
  @HttpCode(201)
  @ApiResponse({ status: 201, description: 'Place saved' })
  @ApiResponse({ status: 400, description: 'Place already saved' })
  @ApiResponse({ status: 404, description: 'Place not found' })
  async savePlace(
    @User('id') userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return await this.savedPlaceService.create(userId, id);
  }

  @Private()
  @Delete(':id')
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Place unsaved' })
  @ApiResponse({ status: 404, description: 'Saved place not found' })
  async unsavePlace(
    @User('id') userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return await this.savedPlaceService.delete(userId, id);
  }

  @Private()
  @Get(':id')
  @ApiResponse({
    status: 200,
    type: SavedPlaceDto,
    description: 'Return saved place by id',
  })
  @ApiResponse({ status: 404, description: 'Saved place not found' })
  async getPlace(
    @User('id') userId: string,
    @Param('id') id: string,
  ): Promise<SavedPlaceDto> {
    return await this.savedPlaceService.findOne(userId, id);
  }

  @Private()
  @Put(':id/tag/:tagId')
  @HttpCode(201)
  @ApiResponse({ status: 201, description: 'Tag linked' })
  @ApiResponse({ status: 400, description: 'Tag already linked' })
  @ApiResponse({ status: 404, description: 'Saved place or tag not found' })
  async addTag(
    @User('id') userId: string,
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ): Promise<void> {
    return await this.savedPlaceService.addTag(userId, id, tagId);
  }

  @Private()
  @Delete(':id/tag/:tagId')
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Tag unlinked' })
  @ApiResponse({ status: 400, description: 'Tag not linked' })
  @ApiResponse({ status: 404, description: 'Saved place not found' })
  async removeTag(
    @User('id') userId: string,
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ): Promise<void> {
    return await this.savedPlaceService.removeTag(userId, id, tagId);
  }

  @Private()
  @Put(':id/comment')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: SavedPlaceDto,
    description: 'Comment added',
  })
  @ApiResponse({ status: 400, description: 'Comment must be provided' })
  @ApiResponse({ status: 404, description: 'Saved place not found' })
  async addComment(
    @User('id') userId: string,
    @Param('id') id: string,
    @Body() body: CommentSavedPlaceDto,
  ): Promise<SavedPlaceDto> {
    return await this.savedPlaceService.addComment(userId, id, body.comment);
  }

  @Private()
  @Put(':id/rating')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    type: SavedPlaceDto,
    description: 'Rating added',
  })
  @ApiResponse({ status: 400, description: 'Rating must be between 0 and 5' })
  @ApiResponse({ status: 404, description: 'Saved place not found' })
  async addRating(
    @User('id') userId: string,
    @Param('id') id: string,
    @Body() body: RatingSavedPlaceDto,
  ): Promise<SavedPlaceDto> {
    return await this.savedPlaceService.addRating(userId, id, body.rating);
  }

  @Private()
  @Patch(':id/done')
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Done toggled' })
  @ApiResponse({ status: 404, description: 'Saved place not found' })
  async toggleDone(
    @User('id') userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return await this.savedPlaceService.toggleDone(userId, id);
  }

  @Private()
  @Get(':id/exists')
  @ApiResponse({
    status: 200,
    type: PlaceIsSavedDto,
    description: 'Return if place is saved',
  })
  @ApiResponse({ status: 404, description: 'Place not found' })
  async exists(
    @User('id') userId: string,
    @Param('id') id: string,
  ): Promise<PlaceIsSavedDto> {
    return await this.savedPlaceService.exists(userId, id);
  }
}
